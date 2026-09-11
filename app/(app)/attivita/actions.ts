"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { pushCounts } from "@/lib/realtime/counts";
import { recordTimelineEvent } from "@/lib/timeline";
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

  const task = await prisma.task.create({
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
  await recordTimelineEvent({ taskId: task.id }, "CREATO");

  revalidatePath("/attivita");
  revalidatePath("/");
  revalidatePath("/calendario");
  void pushCounts(user.id);
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
  revalidatePath(`/attivita/${id}`);
  revalidatePath("/");
  revalidatePath("/calendario");
  void pushCounts(user.id);
}

export async function setTaskStatus(id: string, stato: TaskStatus) {
  const user = await requireUser();
  await prisma.task.updateMany({
    where: { id, userId: user.id },
    data: { stato },
  });

  // Ogni chiamata rappresenta un vero avanzamento (l'UI cicla sempre in
  // avanti DA_FARE -> IN_CORSO -> COMPLETATO -> DA_FARE): lo stato di
  // arrivo basta a decidere l'evento, senza dover rileggere quello precedente.
  if (stato === "IN_CORSO") {
    await recordTimelineEvent({ taskId: id }, "INIZIATO");
  } else if (stato === "COMPLETATO") {
    await recordTimelineEvent({ taskId: id }, "COMPLETATO");
  }

  revalidatePath("/attivita");
  revalidatePath(`/attivita/${id}`);
  void pushCounts(user.id);
}

export async function deleteTask(id: string) {
  const user = await requireUser();
  await prisma.task.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/attivita");
  revalidatePath("/");
  revalidatePath("/calendario");
  void pushCounts(user.id);
}

function formatShortDate(date: Date | null) {
  return date ? date.toLocaleDateString("it-IT", { day: "numeric", month: "short" }) : "nessuna data";
}

export type PostponeFormState = { error?: string } | undefined;

export async function postponeTask(
  id: string,
  _prevState: PostponeFormState,
  formData: FormData
): Promise<PostponeFormState> {
  const user = await requireUser();

  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) {
    return { error: "Attività non trovata." };
  }

  const nuovaScadenza = parseScadenza(formData.get("scadenza"));
  if (!nuovaScadenza) {
    return { error: "Indica la nuova scadenza." };
  }

  const fascia = parseFasciaOraria(formData);
  if ("error" in fascia) return fascia;

  await prisma.task.updateMany({
    where: { id, userId: user.id },
    data: { scadenza: nuovaScadenza, oraInizio: fascia.oraInizio, oraFine: fascia.oraFine },
  });

  await recordTimelineEvent(
    { taskId: id },
    "POSTICIPATO",
    `Scadenza spostata dal ${formatShortDate(existing.scadenza)} al ${formatShortDate(nuovaScadenza)}`
  );

  revalidatePath("/attivita");
  revalidatePath(`/attivita/${id}`);
  revalidatePath("/");
  revalidatePath("/calendario");
}
