"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";

export type SaleFormState = { error?: string } | undefined;

function parseAmount(raw: FormDataEntryValue | null): number | null {
  const value = Number(String(raw ?? "").replace(",", "."));
  return Number.isFinite(value) && value >= 0 ? value : null;
}

function parseData(raw: FormDataEntryValue | null): Date | null {
  const value = String(raw ?? "").trim();
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

type ParsedSale = { cliente: string; prezzo: number; aliquota: number; data: Date; note: string | null };

function parseSaleInput(formData: FormData): { data: ParsedSale } | { error: string } {
  const cliente = String(formData.get("cliente") ?? "").trim();
  if (!cliente) return { error: "Il cliente è obbligatorio." };

  const prezzo = parseAmount(formData.get("prezzo"));
  if (prezzo === null) return { error: "Il prezzo non è valido." };

  const aliquota = parseAmount(formData.get("aliquota"));
  if (aliquota === null) return { error: "L'aliquota non è valida." };

  const data = parseData(formData.get("data"));
  if (!data) return { error: "La data della vendita è obbligatoria." };

  return {
    data: {
      cliente,
      prezzo,
      aliquota,
      data,
      note: String(formData.get("note") ?? "").trim() || null,
    },
  };
}

export async function createSale(_prevState: SaleFormState, formData: FormData): Promise<SaleFormState> {
  const user = await requireUser();
  const parsed = parseSaleInput(formData);
  if ("error" in parsed) return parsed;

  await prisma.sale.create({ data: { ...parsed.data, userId: user.id } });

  revalidatePath("/vendite");
}

export async function updateSale(
  id: string,
  _prevState: SaleFormState,
  formData: FormData
): Promise<SaleFormState> {
  const user = await requireUser();
  const parsed = parseSaleInput(formData);
  if ("error" in parsed) return parsed;

  await prisma.sale.updateMany({ where: { id, userId: user.id }, data: parsed.data });

  revalidatePath("/vendite");
}

export async function deleteSale(id: string) {
  const user = await requireUser();
  await prisma.sale.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/vendite");
}
