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

function isValidHHMM(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

// Fascia oraria opzionale: se uno dei due campi è compilato devono esserlo
// entrambi ed essere coerenti (fine dopo inizio).
function parseFasciaOraria(formData: FormData): { oraInizio: string | null; oraFine: string | null } | { error: string } {
  const oraInizio = String(formData.get("oraInizio") ?? "").trim();
  const oraFine = String(formData.get("oraFine") ?? "").trim();

  if (!oraInizio && !oraFine) return { oraInizio: null, oraFine: null };
  if (!isValidHHMM(oraInizio) || !isValidHHMM(oraFine)) {
    return { error: "Fascia oraria non valida." };
  }
  if (oraFine <= oraInizio) {
    return { error: "L'orario di fine deve essere dopo l'inizio." };
  }
  return { oraInizio, oraFine };
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

  const fascia = parseFasciaOraria(formData);
  if ("error" in fascia) return fascia;

  await prisma.task.create({
    data: {
      userId: user.id,
      titolo,
      descrizione: String(formData.get("descrizione") ?? "").trim() || null,
      tag: parseTags(formData.get("tag")),
      scadenza: parseScadenza(formData.get("scadenza")),
      oraInizio: fascia.oraInizio,
      oraFine: fascia.oraFine,
    },
  });

  revalidatePath("/attivita");
  revalidatePath("/");
  revalidatePath("/calendario");
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

  const fascia = parseFasciaOraria(formData);
  if ("error" in fascia) return fascia;

  await prisma.task.updateMany({
    where: { id, userId: user.id },
    data: {
      titolo,
      descrizione: String(formData.get("descrizione") ?? "").trim() || null,
      tag: parseTags(formData.get("tag")),
      scadenza: parseScadenza(formData.get("scadenza")),
      oraInizio: fascia.oraInizio,
      oraFine: fascia.oraFine,
    },
  });

  revalidatePath("/attivita");
  revalidatePath("/");
  revalidatePath("/calendario");
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
  revalidatePath("/");
  revalidatePath("/calendario");
}
