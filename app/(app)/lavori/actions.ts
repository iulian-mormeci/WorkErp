"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { pushCounts } from "@/lib/realtime/counts";
import { recordTimelineEvent } from "@/lib/timeline";

export type JobFormState = { error?: string } | undefined;

function parseDateField(raw: FormDataEntryValue | null) {
  const value = String(raw ?? "").trim();
  return value ? new Date(value) : null;
}

function isValidHHMM(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

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

function revalidateJobPaths(id?: string) {
  revalidatePath("/lavori");
  if (id) revalidatePath(`/lavori/${id}`);
  revalidatePath("/");
  revalidatePath("/calendario");
}

export async function createJob(
  _prevState: JobFormState,
  formData: FormData
): Promise<JobFormState> {
  const user = await requireUser();
  const titolo = String(formData.get("titolo") ?? "").trim();

  if (!titolo) {
    return { error: "Il titolo è obbligatorio." };
  }

  const fascia = parseFasciaOraria(formData);
  if ("error" in fascia) return fascia;

  const job = await prisma.job.create({
    data: {
      userId: user.id,
      titolo,
      cliente: String(formData.get("cliente") ?? "").trim() || null,
      indirizzo: String(formData.get("indirizzo") ?? "").trim() || null,
      note: String(formData.get("note") ?? "").trim() || null,
      scadenza: parseDateField(formData.get("scadenza")),
      oraInizio: fascia.oraInizio,
      oraFine: fascia.oraFine,
    },
  });
  await recordTimelineEvent({ jobId: job.id }, "CREATO");

  revalidateJobPaths();
  void pushCounts(user.id);
}

export async function updateJob(
  id: string,
  _prevState: JobFormState,
  formData: FormData
): Promise<JobFormState> {
  const user = await requireUser();
  const titolo = String(formData.get("titolo") ?? "").trim();

  if (!titolo) {
    return { error: "Il titolo è obbligatorio." };
  }

  const fascia = parseFasciaOraria(formData);
  if ("error" in fascia) return fascia;

  const existing = await prisma.job.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) {
    return { error: "Lavoro non trovato." };
  }

  const nuovoStato = String(formData.get("stato") ?? "da_pianificare");

  await prisma.job.updateMany({
    where: { id, userId: user.id },
    data: {
      titolo,
      cliente: String(formData.get("cliente") ?? "").trim() || null,
      indirizzo: String(formData.get("indirizzo") ?? "").trim() || null,
      note: String(formData.get("note") ?? "").trim() || null,
      stato: nuovoStato,
      programmatoIl: parseDateField(formData.get("programmatoIl")),
      scadenza: parseDateField(formData.get("scadenza")),
      oraInizio: fascia.oraInizio,
      oraFine: fascia.oraFine,
    },
  });

  // Il form di modifica tocca lo stato solo se l'utente lo cambia
  // esplicitamente: registra l'evento solo sulla vera transizione, non ad
  // ogni salvataggio del form (che potrebbe non toccare lo stato affatto).
  if (nuovoStato !== existing.stato) {
    if (nuovoStato === "in_corso") {
      await recordTimelineEvent({ jobId: id }, "INIZIATO");
    } else if (nuovoStato === "completato") {
      await recordTimelineEvent({ jobId: id }, "COMPLETATO");
    }
  }

  revalidateJobPaths(id);
  void pushCounts(user.id);
}

export async function deleteJob(id: string) {
  const user = await requireUser();
  await prisma.job.deleteMany({ where: { id, userId: user.id } });
  revalidateJobPaths();
  void pushCounts(user.id);
}

function formatShortDate(date: Date | null) {
  return date ? date.toLocaleDateString("it-IT", { day: "numeric", month: "short" }) : "nessuna data";
}

export async function postponeJob(
  id: string,
  _prevState: JobFormState,
  formData: FormData
): Promise<JobFormState> {
  const user = await requireUser();

  const existing = await prisma.job.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) {
    return { error: "Lavoro non trovato." };
  }
  // I lavori UnoERP sono gestiti/sovrascritti dalla sync: posticipare a mano
  // non avrebbe senso, verrebbe perso al prossimo giro.
  if (existing.origine === "UNOERP") {
    return { error: "Un lavoro sincronizzato da UnoERP non può essere posticipato manualmente." };
  }

  const nuovaScadenza = parseDateField(formData.get("scadenza"));
  if (!nuovaScadenza) {
    return { error: "Indica la nuova scadenza." };
  }

  const fascia = parseFasciaOraria(formData);
  if ("error" in fascia) return fascia;

  await prisma.job.updateMany({
    where: { id, userId: user.id },
    data: { scadenza: nuovaScadenza, oraInizio: fascia.oraInizio, oraFine: fascia.oraFine },
  });

  await recordTimelineEvent(
    { jobId: id },
    "POSTICIPATO",
    `Scadenza spostata dal ${formatShortDate(existing.scadenza)} al ${formatShortDate(nuovaScadenza)}`
  );

  revalidateJobPaths(id);
}
