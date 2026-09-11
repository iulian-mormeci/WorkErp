"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";

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

function revalidateJobPaths() {
  revalidatePath("/lavori");
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

  await prisma.job.create({
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

  revalidateJobPaths();
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

  await prisma.job.updateMany({
    where: { id, userId: user.id },
    data: {
      titolo,
      cliente: String(formData.get("cliente") ?? "").trim() || null,
      indirizzo: String(formData.get("indirizzo") ?? "").trim() || null,
      note: String(formData.get("note") ?? "").trim() || null,
      stato: String(formData.get("stato") ?? "da_pianificare"),
      programmatoIl: parseDateField(formData.get("programmatoIl")),
      scadenza: parseDateField(formData.get("scadenza")),
      oraInizio: fascia.oraInizio,
      oraFine: fascia.oraFine,
    },
  });

  revalidateJobPaths();
}

export async function deleteJob(id: string) {
  const user = await requireUser();
  await prisma.job.deleteMany({ where: { id, userId: user.id } });
  revalidateJobPaths();
}
