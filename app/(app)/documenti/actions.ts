"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { saveUpload, deleteUpload } from "@/lib/storage";

export type DocumentFormState = { error?: string } | undefined;

function parseTags(raw: FormDataEntryValue | null) {
  return String(raw ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export async function uploadDocument(
  _prevState: DocumentFormState,
  formData: FormData
): Promise<DocumentFormState> {
  const user = await requireUser();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Seleziona un file da caricare." };
  }

  let percorso: string;
  try {
    percorso = await saveUpload(file, "documents");
  } catch {
    return { error: "Il file supera i 100MB consentiti." };
  }

  await prisma.document.create({
    data: {
      userId: user.id,
      nomeOriginale: file.name,
      cartella: String(formData.get("cartella") ?? "").trim(),
      tag: parseTags(formData.get("tag")),
      percorso,
      dimensione: file.size,
      mimeType: file.type || "application/octet-stream",
    },
  });

  revalidatePath("/documenti");
}

export async function updateDocumentMeta(
  id: string,
  _prevState: DocumentFormState,
  formData: FormData
): Promise<DocumentFormState> {
  const user = await requireUser();

  await prisma.document.updateMany({
    where: { id, userId: user.id },
    data: {
      cartella: String(formData.get("cartella") ?? "").trim(),
      tag: parseTags(formData.get("tag")),
    },
  });

  revalidatePath("/documenti");
  return undefined;
}

export async function deleteDocument(id: string) {
  const user = await requireUser();

  const document = await prisma.document.findUnique({ where: { id } });
  if (!document || document.userId !== user.id) return;

  await prisma.document.delete({ where: { id } });
  await deleteUpload(document.percorso);

  revalidatePath("/documenti");
}
