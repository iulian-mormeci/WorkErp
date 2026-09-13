"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { APP_TIME_ZONE, zonedTimeToUtc } from "@/lib/timezone";
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

// I campi "data" e "datetime-local" del form restituiscono una stringa
// senza fuso orario (es. "2026-09-14T11:00"): `new Date(...)` la
// interpreterebbe nel fuso del *server*, non in quello italiano — in
// produzione, in Docker, il server è quasi sempre UTC, quindi un evento
// delle 11:00 finirebbe salvato come le 11:00 UTC (le 13:00 ora italiana
// una volta visualizzato). Va sempre passata da questa conversione civile
// esplicita, mai da `new Date()` diretto.
function parseCivileDateTime(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  if (!match) return null;
  const [, y, m, d, h, min] = match;
  return zonedTimeToUtc(Number(y), Number(m), Number(d), Number(h), Number(min), APP_TIME_ZONE);
}

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
    const parsed = parseCivileDateTime(`${data}T00:00`);
    if (!parsed) return { error: "Data non valida." };
    inizio = parsed;
    fine = new Date(parsed.getTime() + 24 * 60 * 60_000);
  } else {
    const inizioRaw = String(formData.get("inizio") ?? "");
    const fineRaw = String(formData.get("fine") ?? "");
    const parsedInizio = parseCivileDateTime(inizioRaw);
    const parsedFine = parseCivileDateTime(fineRaw);
    if (!parsedInizio || !parsedFine) {
      return { error: "Data e ora non valide." };
    }
    inizio = parsedInizio;
    fine = parsedFine;
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

  // redirectTo è un argomento bound lato client (visibile/modificabile come
  // hidden field): senza validare che sia un path interno, un utente potrebbe
  // farsi reindirizzare altrove dopo l'eliminazione (open redirect).
  const safeRedirectTo =
    redirectTo.startsWith("/") && !redirectTo.startsWith("//") ? redirectTo : "/calendario";
  redirect(safeRedirectTo);
}
