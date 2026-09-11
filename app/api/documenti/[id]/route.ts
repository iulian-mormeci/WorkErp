import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { readUpload } from "@/lib/storage";

// A differenza di /api/uploads/[...path] (che autentica solo "sei loggato",
// adatto ai Manuali condivisibili), qui verifica anche la proprietà: i
// Documenti sono il backup personale dell'utente, non condivisi.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return new Response("Non autorizzato", { status: 401 });
  }

  const { id } = await params;

  const document = await prisma.document.findUnique({ where: { id } });
  if (!document || document.userId !== session.user.id) {
    return new Response("Non trovato", { status: 404 });
  }

  const file = await readUpload(document.percorso);
  if (!file) {
    return new Response("Non trovato", { status: 404 });
  }

  return new Response(new Uint8Array(file.data), {
    headers: {
      "Content-Type": file.contentType,
      "Content-Disposition": `attachment; filename="${encodeURIComponent(document.nomeOriginale)}"`,
    },
  });
}
