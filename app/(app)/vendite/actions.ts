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

type ParsedSaleLine = { descrizione: string; quantita: number; prezzoUnitario: number };
type ParsedSale = {
  cliente: string;
  aliquota: number;
  data: Date;
  dataConsegnaPrevista: Date | null;
  note: string | null;
  items: ParsedSaleLine[];
};

function parseSaleLines(formData: FormData): { items: ParsedSaleLine[] } | { error: string } {
  const descrizioni = formData.getAll("descrizione").map(String);
  const quantita = formData.getAll("quantita").map(String);
  const prezzi = formData.getAll("prezzoUnitario").map(String);

  const items: ParsedSaleLine[] = [];
  for (let i = 0; i < descrizioni.length; i++) {
    const descrizione = descrizioni[i].trim();
    // Riga vuota (nessuna descrizione compilata) — ignorata, non è un errore:
    // permette righe extra lasciate in bianco nel form.
    if (!descrizione) continue;

    const qty = Number(quantita[i]);
    if (!Number.isInteger(qty) || qty <= 0) {
      return { error: `Quantità non valida per "${descrizione}".` };
    }

    const prezzoUnitario = parseAmount(prezzi[i] ?? null);
    if (prezzoUnitario === null) {
      return { error: `Prezzo unitario non valido per "${descrizione}".` };
    }

    items.push({ descrizione, quantita: qty, prezzoUnitario });
  }

  if (items.length === 0) {
    return { error: "Inserisci almeno un articolo venduto." };
  }

  return { items };
}

function parseSaleInput(formData: FormData): { data: ParsedSale } | { error: string } {
  const cliente = String(formData.get("cliente") ?? "").trim();
  if (!cliente) return { error: "Il cliente è obbligatorio." };

  const aliquota = parseAmount(formData.get("aliquota"));
  if (aliquota === null) return { error: "L'aliquota non è valida." };

  const data = parseData(formData.get("data"));
  if (!data) return { error: "La data della vendita è obbligatoria." };

  const dataConsegnaPrevista = parseData(formData.get("dataConsegnaPrevista"));

  const parsedLines = parseSaleLines(formData);
  if ("error" in parsedLines) return parsedLines;

  return {
    data: {
      cliente,
      aliquota,
      data,
      dataConsegnaPrevista,
      note: String(formData.get("note") ?? "").trim() || null,
      items: parsedLines.items,
    },
  };
}

export async function createSale(_prevState: SaleFormState, formData: FormData): Promise<SaleFormState> {
  const user = await requireUser();
  const parsed = parseSaleInput(formData);
  if ("error" in parsed) return parsed;

  const { items, ...sale } = parsed.data;
  await prisma.sale.create({
    data: {
      ...sale,
      userId: user.id,
      items: {
        create: items.map((item, ordine) => ({ ...item, ordine })),
      },
    },
  });

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

  const existing = await prisma.sale.findUnique({ where: { id }, select: { userId: true } });
  if (!existing || existing.userId !== user.id) {
    return { error: "Vendita non trovata." };
  }

  const { items, ...sale } = parsed.data;
  await prisma.$transaction([
    prisma.sale.update({ where: { id }, data: sale }),
    prisma.saleLine.deleteMany({ where: { saleId: id } }),
    prisma.saleLine.createMany({
      data: items.map((item, ordine) => ({ ...item, ordine, saleId: id })),
    }),
  ]);

  revalidatePath("/vendite");
}

export async function deleteSale(id: string) {
  const user = await requireUser();
  await prisma.sale.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/vendite");
}
