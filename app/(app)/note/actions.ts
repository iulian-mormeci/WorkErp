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

  await prisma.note.updateMany({
    where: { id, userId: user.id },
    data: {
      titolo,
      contenuto: String(formData.get("contenuto") ?? "").trim(),
    },
  });

  revalidatePath("/note");
}

export async function deleteNote(id: string) {
  const user = await requireUser();
  await prisma.note.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/note");
}
