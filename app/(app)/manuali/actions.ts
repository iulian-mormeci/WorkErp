"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser, requireAdmin } from "@/lib/auth/session";
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
  const user = await requireUser();
  const titolo = String(formData.get("titolo") ?? "").trim();

  if (!titolo) {
    return { error: "Il titolo è obbligatorio." };
  }

  const allegati = await saveNewAttachments(formData);
  const isPublic = formData.get("isPublic") === "on";

  const manual = await prisma.manual.create({
    data: {
      ownerId: user.id,
      titolo,
      marca: textOrNull(formData, "marca"),
      modello: textOrNull(formData, "modello"),
      categoria: textOrNull(formData, "categoria"),
      contenuto: String(formData.get("contenuto") ?? "").trim(),
      allegati,
      isPublic,
      // Se nasce già pubblico serve comunque l'approvazione: nessun default
      // esplicito qui, resta IN_ATTESA come da default dello schema.
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
  const user = await requireUser();
  const titolo = String(formData.get("titolo") ?? "").trim();

  if (!titolo) {
    return { error: "Il titolo è obbligatorio." };
  }

  const existing = await prisma.manual.findUnique({ where: { id } });
  if (!existing || (existing.ownerId !== user.id && user.ruolo !== "ADMIN")) {
    return { error: "Manuale non trovato." };
  }

  const newAttachments = await saveNewAttachments(formData);
  const isPublic = formData.get("isPublic") === "on";
  // Ogni transizione privato -> pubblico richiede una nuova approvazione,
  // anche se in passato era già stato approvato: mai fidarsi di un
  // moderazioneStato mandato dal client, lo decide solo il server.
  const justMadePublic = isPublic && !existing.isPublic;

  const manual = await prisma.manual.update({
    where: { id },
    data: {
      titolo,
      marca: textOrNull(formData, "marca"),
      modello: textOrNull(formData, "modello"),
      categoria: textOrNull(formData, "categoria"),
      contenuto: String(formData.get("contenuto") ?? "").trim(),
      isPublic,
      ...(justMadePublic ? { moderazioneStato: "IN_ATTESA" } : {}),
      ...(newAttachments.length > 0
        ? { allegati: { push: newAttachments } }
        : {}),
    },
  });

  revalidatePath("/manuali");
  revalidatePath("/manuali/catalogo");
  revalidatePath(`/manuali/${manual.id}`);
  redirect(`/manuali/${manual.id}`);
}

export async function deleteManualAttachment(manualId: string, relativePath: string) {
  const user = await requireUser();

  const manual = await prisma.manual.findUnique({ where: { id: manualId } });
  if (!manual || (manual.ownerId !== user.id && user.ruolo !== "ADMIN")) return;

  // Cancella il file solo se è davvero un allegato di questo manuale, altrimenti
  // un utente autenticato potrebbe far cancellare l'allegato di un altro manuale
  // passando un relativePath arbitrario (IDOR).
  if (!manual.allegati.includes(relativePath)) return;

  await prisma.manual.update({
    where: { id: manualId },
    data: { allegati: manual.allegati.filter((path) => path !== relativePath) },
  });
  await deleteUpload(relativePath);

  revalidatePath(`/manuali/${manualId}`);
}

export async function deleteManual(id: string) {
  const user = await requireUser();

  const manual = await prisma.manual.findUnique({ where: { id } });
  if (!manual || (manual.ownerId !== user.id && user.ruolo !== "ADMIN")) return;

  await Promise.all(manual.allegati.map((path) => deleteUpload(path)));
  await prisma.manual.delete({ where: { id } });

  revalidatePath("/manuali");
  revalidatePath("/manuali/catalogo");
  redirect("/manuali");
}

// --- Catalogo pubblico / libreria personale ---

export async function addToLibrary(manualId: string) {
  const user = await requireUser();

  const manual = await prisma.manual.findUnique({ where: { id: manualId } });
  if (!manual) return;
  if (manual.ownerId === user.id) return; // il proprietario ha già accesso
  if (!manual.isPublic || manual.moderazioneStato !== "APPROVATO") return;

  await prisma.userManualLibrary
    .create({ data: { userId: user.id, manualId } })
    .catch(() => {}); // vincolo unico: se già presente, no-op

  revalidatePath("/manuali");
  revalidatePath("/manuali/catalogo");
}

export async function removeFromLibrary(manualId: string) {
  const user = await requireUser();
  await prisma.userManualLibrary.deleteMany({ where: { userId: user.id, manualId } });
  revalidatePath("/manuali");
  revalidatePath("/manuali/catalogo");
}

// --- Moderazione (admin) ---

export async function approveManual(id: string) {
  await requireAdmin();
  await prisma.manual.update({ where: { id }, data: { moderazioneStato: "APPROVATO" } });
  revalidatePath("/admin");
  revalidatePath("/manuali/catalogo");
}

export async function rejectManual(id: string) {
  await requireAdmin();
  await prisma.manual.update({ where: { id }, data: { moderazioneStato: "RIFIUTATO" } });
  revalidatePath("/admin");
  revalidatePath("/manuali/catalogo");
}
