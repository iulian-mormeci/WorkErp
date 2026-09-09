"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { saveUpload, deleteUpload } from "@/lib/storage";

export type ManualFormState = { error?: string } | undefined;

function textOrNull(formData: FormData, field: string) {
  return String(formData.get(field) ?? "").trim() || null;
}

async function saveNewAttachments(formData: FormData) {
  const files = formData.getAll("allegati").filter((f): f is File => f instanceof File && f.size > 0);
  const paths: string[] = [];
  for (const file of files) {
    paths.push(await saveUpload(file, "manuals"));
  }
  return paths;
}

export async function createManual(
  _prevState: ManualFormState,
  formData: FormData
): Promise<ManualFormState> {
  await requireUser();
  const titolo = String(formData.get("titolo") ?? "").trim();

  if (!titolo) {
    return { error: "Il titolo è obbligatorio." };
  }

  const allegati = await saveNewAttachments(formData);

  const manual = await prisma.manual.create({
    data: {
      titolo,
      marca: textOrNull(formData, "marca"),
      modello: textOrNull(formData, "modello"),
      categoria: textOrNull(formData, "categoria"),
      contenuto: String(formData.get("contenuto") ?? "").trim(),
      allegati,
    },
  });

  revalidatePath("/manuali");
  redirect(`/manuali/${manual.id}`);
}

export async function updateManual(
  id: string,
  _prevState: ManualFormState,
  formData: FormData
): Promise<ManualFormState> {
  await requireUser();
  const titolo = String(formData.get("titolo") ?? "").trim();

  if (!titolo) {
    return { error: "Il titolo è obbligatorio." };
  }

  const newAttachments = await saveNewAttachments(formData);

  const manual = await prisma.manual.update({
    where: { id },
    data: {
      titolo,
      marca: textOrNull(formData, "marca"),
      modello: textOrNull(formData, "modello"),
      categoria: textOrNull(formData, "categoria"),
      contenuto: String(formData.get("contenuto") ?? "").trim(),
      ...(newAttachments.length > 0
        ? { allegati: { push: newAttachments } }
        : {}),
    },
  });

  revalidatePath("/manuali");
  revalidatePath(`/manuali/${manual.id}`);
  redirect(`/manuali/${manual.id}`);
}

export async function deleteManualAttachment(manualId: string, relativePath: string) {
  await requireUser();

  const manual = await prisma.manual.findUnique({ where: { id: manualId } });
  if (!manual) return;

  await prisma.manual.update({
    where: { id: manualId },
    data: { allegati: manual.allegati.filter((path) => path !== relativePath) },
  });
  await deleteUpload(relativePath);

  revalidatePath(`/manuali/${manualId}`);
}

export async function deleteManual(id: string) {
  await requireUser();

  const manual = await prisma.manual.findUnique({ where: { id } });
  if (!manual) return;

  await Promise.all(manual.allegati.map((path) => deleteUpload(path)));
  await prisma.manual.delete({ where: { id } });

  revalidatePath("/manuali");
  redirect("/manuali");
}
