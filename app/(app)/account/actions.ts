"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import { requireUser } from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

export type ActionState = { error?: string; success?: string } | undefined;

export async function updateProfile(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!nome || !email) {
    return { error: "Nome ed email sono obbligatori." };
  }

  try {
    await prisma.user.update({ where: { id: user.id }, data: { nome, email } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { error: "Questa email è già in uso." };
    }
    throw e;
  }

  revalidatePath("/account");
  revalidatePath("/", "layout");
  return { success: "Dati aggiornati." };
}

export async function changePassword(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: "Compila tutti i campi." };
  }
  if (newPassword.length < 8) {
    return { error: "La nuova password deve avere almeno 8 caratteri." };
  }
  if (newPassword !== confirmPassword) {
    return { error: "Le password non coincidono." };
  }

  const dbUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  const valid = await verifyPassword(dbUser.passwordHash, currentPassword);
  if (!valid) {
    return { error: "Password attuale errata." };
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  return { success: "Password aggiornata." };
}

function isValidHHMM(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export async function addWorkScheduleSlot(
  giornoSettimana: number,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const oraInizio = String(formData.get("oraInizio") ?? "");
  const oraFine = String(formData.get("oraFine") ?? "");

  if (!isValidHHMM(oraInizio) || !isValidHHMM(oraFine)) {
    return { error: "Orari non validi." };
  }
  if (oraFine <= oraInizio) {
    return { error: "L'orario di fine deve essere dopo l'inizio." };
  }

  const existing = await prisma.workSchedule.findMany({
    where: { userId: user.id, giornoSettimana },
  });
  const overlaps = existing.some(
    (slot) => slot.oraInizio < oraFine && oraInizio < slot.oraFine
  );
  if (overlaps) {
    return { error: "Questa fascia si sovrappone a una già presente." };
  }

  await prisma.workSchedule.create({
    data: { userId: user.id, giornoSettimana, oraInizio, oraFine },
  });

  revalidatePath("/account");
}

export async function deleteWorkScheduleSlot(id: string) {
  const user = await requireUser();
  await prisma.workSchedule.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/account");
}
