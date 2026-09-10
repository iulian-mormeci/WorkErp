"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import type { EventType } from "@/lib/generated/prisma/enums";

export type EventFormState = { error?: string } | undefined;

type ParsedEvent = {
  titolo: string;
  tuttoIlGiorno: boolean;
  luogo: string | null;
  tipo: EventType;
  inizio: Date;
  fine: Date;
};

function parseEventFields(formData: FormData): ParsedEvent | { error: string } {
  const titolo = String(formData.get("titolo") ?? "").trim();
  if (!titolo) return { error: "Il titolo è obbligatorio." };

  const tuttoIlGiorno = formData.get("tuttoIlGiorno") === "on";
  const luogo = String(formData.get("luogo") ?? "").trim() || null;
  const tipoRaw = String(formData.get("tipo") ?? "EVENTO");
  const tipo: EventType = tipoRaw === "ATTIVITA" ? "ATTIVITA" : "EVENTO";

  let inizio: Date;
  let fine: Date;

  if (tuttoIlGiorno) {
    const data = String(formData.get("data") ?? "");
    const parsed = new Date(`${data}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return { error: "Data non valida." };
    inizio = parsed;
    fine = new Date(parsed.getTime() + 24 * 60 * 60_000);
  } else {
    const inizioRaw = String(formData.get("inizio") ?? "");
    const fineRaw = String(formData.get("fine") ?? "");
    inizio = new Date(inizioRaw);
    fine = new Date(fineRaw);
    if (Number.isNaN(inizio.getTime()) || Number.isNaN(fine.getTime())) {
      return { error: "Data e ora non valide." };
    }
    if (fine <= inizio) {
      return { error: "L'orario di fine deve essere dopo l'inizio." };
    }
  }

  return { titolo, tuttoIlGiorno, luogo, tipo, inizio, fine };
}

function revalidateCalendarPaths() {
  revalidatePath("/");
  revalidatePath("/calendario");
}

export async function createEvent(
  _prevState: EventFormState,
  formData: FormData
): Promise<EventFormState> {
  const user = await requireUser();
  const parsed = parseEventFields(formData);
  if ("error" in parsed) return { error: parsed.error };

  await prisma.event.create({
    data: {
      userId: user.id,
      titolo: parsed.titolo,
      descrizione: null,
      inizio: parsed.inizio,
      fine: parsed.fine,
      tuttoIlGiorno: parsed.tuttoIlGiorno,
      luogo: parsed.luogo,
      tipo: parsed.tipo,
    },
  });

  revalidateCalendarPaths();
}

export async function updateEvent(
  id: string,
  _prevState: EventFormState,
  formData: FormData
): Promise<EventFormState> {
  const user = await requireUser();
  const parsed = parseEventFields(formData);
  if ("error" in parsed) return { error: parsed.error };

  await prisma.event.updateMany({
    where: { id, userId: user.id },
    data: {
      titolo: parsed.titolo,
      inizio: parsed.inizio,
      fine: parsed.fine,
      tuttoIlGiorno: parsed.tuttoIlGiorno,
      luogo: parsed.luogo,
      tipo: parsed.tipo,
    },
  });

  revalidateCalendarPaths();
}

export async function deleteEvent(id: string, redirectTo: string) {
  const user = await requireUser();
  await prisma.event.deleteMany({ where: { id, userId: user.id } });
  revalidateCalendarPaths();
  redirect(redirectTo);
}
