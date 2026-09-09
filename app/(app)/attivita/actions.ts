"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import type { TaskStatus } from "@/lib/generated/prisma/enums";

export type TaskFormState = { error?: string } | undefined;

function parseTags(raw: FormDataEntryValue | null) {
  return String(raw ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function parseScadenza(raw: FormDataEntryValue | null) {
  const value = String(raw ?? "").trim();
  return value ? new Date(value) : null;
}

export async function createTask(
  _prevState: TaskFormState,
  formData: FormData
): Promise<TaskFormState> {
  const user = await requireUser();
  const titolo = String(formData.get("titolo") ?? "").trim();

  if (!titolo) {
    return { error: "Il titolo è obbligatorio." };
  }

  await prisma.task.create({
    data: {
      userId: user.id,
      titolo,
      descrizione: String(formData.get("descrizione") ?? "").trim() || null,
      tag: parseTags(formData.get("tag")),
      scadenza: parseScadenza(formData.get("scadenza")),
    },
  });

  revalidatePath("/attivita");
}

export async function updateTask(
  id: string,
  _prevState: TaskFormState,
  formData: FormData
): Promise<TaskFormState> {
  const user = await requireUser();
  const titolo = String(formData.get("titolo") ?? "").trim();

  if (!titolo) {
    return { error: "Il titolo è obbligatorio." };
  }

  await prisma.task.updateMany({
    where: { id, userId: user.id },
    data: {
      titolo,
      descrizione: String(formData.get("descrizione") ?? "").trim() || null,
      tag: parseTags(formData.get("tag")),
      scadenza: parseScadenza(formData.get("scadenza")),
    },
  });

  revalidatePath("/attivita");
}

export async function setTaskStatus(id: string, stato: TaskStatus) {
  const user = await requireUser();
  await prisma.task.updateMany({
    where: { id, userId: user.id },
    data: { stato },
  });
  revalidatePath("/attivita");
}

export async function deleteTask(id: string) {
  const user = await requireUser();
  await prisma.task.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/attivita");
}
