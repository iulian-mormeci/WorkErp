import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { readUpload } from "@/lib/storage";

// Serve solo allegati dei Manuali, con la stessa regola di visibilità della
// pagina di dettaglio (proprietario, in libreria, pubblico approvato, admin).
// Documenti e allegati di chat hanno le loro route con controllo di proprietà
// (/api/documenti/[id], /api/chat/[messageId]) e non devono passare da qui.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const session = await getSession();
  if (!session) {
    return new Response("Non autorizzato", { status: 401 });
  }

  const { path: segments } = await params;
  const relativePath = segments.join("/");
  const notFound = new Response("Non trovato", { status: 404 });
  if (!relativePath.startsWith("manuals/")) return notFound;

  const user = session.user;
  const manual = await prisma.manual.findFirst({
    where: {
      allegati: { has: relativePath },
      ...(user.ruolo === "ADMIN"
        ? {}
        : {
            OR: [
              { ownerId: user.id },
              { library: { some: { userId: user.id } } },
              { isPublic: true, moderazioneStato: "APPROVATO" },
            ],
          }),
    },
    select: { id: true },
  });
  if (!manual) return notFound;

  const file = await readUpload(relativePath);
  if (!file) return notFound;

  return new Response(new Uint8Array(file.data), {
    headers: {
      "Content-Type": file.contentType,
      // Niente download forzato: i Manuali si aprono inline in una nuova scheda.
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
