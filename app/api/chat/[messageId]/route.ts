import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { readUpload } from "@/lib/storage";

// L'allegato di un messaggio è visibile a chiunque partecipi alla
// conversazione, non solo a chi lo ha inviato — a differenza di Documenti
// (backup personale) qui la "proprietà" è la partecipazione, non un
// singolo userId.
export async function GET(_request: Request, { params }: { params: Promise<{ messageId: string }> }) {
  const session = await getSession();
  if (!session) {
    return new Response("Non autorizzato", { status: 401 });
  }

  const { messageId } = await params;

  const message = await prisma.message.findUnique({ where: { id: messageId } });
  if (!message || !message.allegato) {
    return new Response("Non trovato", { status: 404 });
  }

  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId: message.conversationId, userId: session.user.id } },
  });
  if (!participant) {
    return new Response("Non trovato", { status: 404 });
  }

  const file = await readUpload(message.allegato);
  if (!file) {
    return new Response("Non trovato", { status: 404 });
  }

  // Forza il download invece del rendering inline nel browser: un allegato
  // di chat non è mai stato pensato per essere aperto/eseguito nella
  // scheda (a differenza, ad esempio, di un'anteprima immagine), quindi non
  // c'è motivo di lasciare al browser la scelta di come interpretarlo.
  const filename = message.allegato.split("/").pop() ?? "allegato";
  return new Response(new Uint8Array(file.data), {
    headers: {
      "Content-Type": file.contentType,
      "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
