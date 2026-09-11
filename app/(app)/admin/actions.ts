"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import type { Ruolo } from "@/lib/generated/prisma/enums";
import { requireAdmin } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";

export type AdminFormState = { error?: string; success?: string } | undefined;

export async function createUserByAdmin(
  _prevState: AdminFormState,
  formData: FormData
): Promise<AdminFormState> {
  await requireAdmin();

  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const ruoloRaw = String(formData.get("ruolo") ?? "USER");
  const ruolo: Ruolo = ruoloRaw === "ADMIN" ? "ADMIN" : "USER";
  const categoryId = String(formData.get("categoryId") ?? "").trim() || null;

  if (!nome || !email || !password) {
    return { error: "Nome, email e password sono obbligatori." };
  }
  if (password.length < 8) {
    return { error: "La password deve avere almeno 8 caratteri." };
  }

  const passwordHash = await hashPassword(password);

  try {
    await prisma.user.create({
      data: { nome, email, passwordHash, ruolo, categoryId },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { error: "Questa email è già in uso." };
    }
    throw e;
  }

  revalidatePath("/admin");
  return { success: "Utente creato." };
}

export async function createCategory(
  _prevState: AdminFormState,
  formData: FormData
): Promise<AdminFormState> {
  await requireAdmin();
  const nome = String(formData.get("nome") ?? "").trim();
  if (!nome) return { error: "Il nome della categoria è obbligatorio." };

  await prisma.userCategory.create({ data: { nome } });
  revalidatePath("/admin");
}
