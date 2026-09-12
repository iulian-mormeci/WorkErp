"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";

export type NoteFormState = { error?: string } | undefined;

export async function createNote(
  _prevState: NoteFormState,
  formData: FormData
): Promise<NoteFormState> {
  const user = await requireUser();
  const titolo = String(formData.get("titolo") ?? "").trim();

  if (!titolo) {
    return { error: "Il titolo è obbligatorio." };
  }

  await prisma.note.create({
    data: {
      userId: user.id,
      titolo,
      contenuto: String(formData.get("contenuto") ?? "").trim(),
    },
  });

  revalidatePath("/note");
}

// A differenza delle altre entità, una Nota può essere modificata anche da
// chi non la possiede (i condivisi, deciso col proprietario) — non basta
// più il classico `updateMany({where:{id, userId}})`, serve leggere la nota
// e controllare proprietà OPPURE condivisione.
export async function updateNote(
  id: string,
  _prevState: NoteFormState,
  formData: FormData
): Promise<NoteFormState> {
  const user = await requireUser();
  const titolo = String(formData.get("titolo") ?? "").trim();

  if (!titolo) {
    return { error: "Il titolo è obbligatorio." };
  }

  const note = await prisma.note.findUnique({
    where: { id },
    include: { shares: { where: { userId: user.id }, select: { userId: true } } },
  });
  if (!note || (note.userId !== user.id && note.shares.length === 0)) {
    return { error: "Nota non trovata." };
  }

  await prisma.note.update({
    where: { id },
    data: {
      titolo,
      contenuto: String(formData.get("contenuto") ?? "").trim(),
    },
  });

  revalidatePath("/note");
}

// Eliminare resta un privilegio esclusivo del proprietario, anche se i
// condivisi possono modificare il contenuto.
export async function deleteNote(id: string) {
  const user = await requireUser();
  await prisma.note.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/note");
}

// Sostituisce l'intera lista dei condivisi con quella inviata (più semplice
// di calcolare un diff aggiungi/rimuovi) — solo il proprietario può
// decidere con chi condividere.
export async function setNoteShares(noteId: string, formData: FormData) {
  const user = await requireUser();

  const note = await prisma.note.findUnique({ where: { id: noteId }, select: { userId: true } });
  if (!note || note.userId !== user.id) return;

  const userIds = formData
    .getAll("condivisi")
    .map(String)
    .filter((id) => id && id !== user.id);

  await prisma.$transaction([
    prisma.noteShare.deleteMany({ where: { noteId } }),
    ...(userIds.length > 0
      ? [prisma.noteShare.createMany({ data: userIds.map((userId) => ({ noteId, userId })) })]
      : []),
  ]);

  revalidatePath("/note");
}
