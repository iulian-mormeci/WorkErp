"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";

export type JobFormState = { error?: string } | undefined;

function parseProgrammatoIl(raw: FormDataEntryValue | null) {
  const value = String(raw ?? "").trim();
  return value ? new Date(value) : null;
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

  await prisma.job.create({
    data: {
      userId: user.id,
      titolo,
      cliente: String(formData.get("cliente") ?? "").trim() || null,
      indirizzo: String(formData.get("indirizzo") ?? "").trim() || null,
      note: String(formData.get("note") ?? "").trim() || null,
    },
  });

  revalidatePath("/lavori");
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

  await prisma.job.updateMany({
    where: { id, userId: user.id },
    data: {
      titolo,
      cliente: String(formData.get("cliente") ?? "").trim() || null,
      indirizzo: String(formData.get("indirizzo") ?? "").trim() || null,
      note: String(formData.get("note") ?? "").trim() || null,
      stato: String(formData.get("stato") ?? "da_pianificare"),
      programmatoIl: parseProgrammatoIl(formData.get("programmatoIl")),
    },
  });

  revalidatePath("/lavori");
}

export async function deleteJob(id: string) {
  const user = await requireUser();
  await prisma.job.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/lavori");
}
