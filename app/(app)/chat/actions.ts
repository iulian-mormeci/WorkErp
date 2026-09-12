"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { saveUpload } from "@/lib/storage";
import { sendToUsers } from "@/lib/realtime/hub";
import { pushCounts } from "@/lib/realtime/counts";

export type ChatFormState = { error?: string } | undefined;

async function assertParticipant(conversationId: string, userId: string) {
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  return Boolean(participant);
}

// Riusa la conversazione 1:1 esistente fra i due utenti se già c'è, invece
// di crearne una nuova ogni volta che clicchi sullo stesso collega.
export async function startDirectConversation(otherUserId: string) {
  const user = await requireUser();
  if (otherUserId === user.id) return;

  const existing = await prisma.conversation.findFirst({
    where: {
      isGroup: false,
      participants: { some: { userId: user.id } },
      AND: { participants: { some: { userId: otherUserId } } },
    },
    select: { id: true },
  });

  const conversationId =
    existing?.id ??
    (
      await prisma.conversation.create({
        data: {
          isGroup: false,
          participants: { create: [{ userId: user.id }, { userId: otherUserId }] },
        },
      })
    ).id;

  redirect(`/chat/${conversationId}`);
}

export async function createGroupConversation(_prevState: ChatFormState, formData: FormData): Promise<ChatFormState> {
  const user = await requireUser();
  const nome = String(formData.get("nome") ?? "").trim();
  const memberIds = formData.getAll("membri").map(String).filter(Boolean);

  if (!nome) return { error: "Dai un nome al gruppo." };
  if (memberIds.length === 0) return { error: "Seleziona almeno un partecipante." };

  const conversation = await prisma.conversation.create({
    data: {
      isGroup: true,
      nome,
      participants: {
        create: [user.id, ...memberIds.filter((id) => id !== user.id)].map((userId) => ({ userId })),
      },
    },
  });

  redirect(`/chat/${conversation.id}`);
}

export async function sendMessage(conversationId: string, formData: FormData) {
  const user = await requireUser();
  if (!(await assertParticipant(conversationId, user.id))) return;

  const testo = String(formData.get("testo") ?? "").trim();
  const file = formData.get("allegato");

  let allegato: string | null = null;
  if (file instanceof File && file.size > 0) {
    try {
      allegato = await saveUpload(file, "chat");
    } catch {
      return; // file troppo grande: il messaggio non viene inviato, niente da salvare a metà.
    }
  }

  if (!testo && !allegato) return;

  const message = await prisma.message.create({
    data: { conversationId, senderId: user.id, testo: testo || null, allegato },
  });

  const others = await prisma.conversationParticipant.findMany({
    where: { conversationId, userId: { not: user.id } },
    select: { userId: true },
  });
  const otherIds = others.map((p) => p.userId);

  sendToUsers(otherIds, {
    type: "chat:message",
    conversationId,
    message: { id: message.id, testo: message.testo, senderId: message.senderId, createdAt: message.createdAt },
  });
  for (const id of otherIds) void pushCounts(id);

  revalidatePath(`/chat/${conversationId}`);
  revalidatePath("/chat");
}

export async function markConversationRead(conversationId: string) {
  const user = await requireUser();
  await prisma.conversationParticipant.updateMany({
    where: { conversationId, userId: user.id },
    data: { lastReadAt: new Date() },
  });
  void pushCounts(user.id);
}
