import type { UnoErpRawActivity } from "@/lib/unoerp/client";
import { APP_TIME_ZONE, zonedTimeToUtc, zonedYearMonthDay } from "@/lib/timezone";

export type MappedUnoErpJob = {
  unoerpId: string;
  titolo: string;
  cliente?: string;
  programmatoIl: Date;
  note?: string;
  categoria?: string;
  priorita?: string;
  /** Fascia oraria dell'intervento ("HH:mm"), solo se `dalle`/`alle` sono entrambi validi e coerenti. */
  oraInizio?: string;
  oraFine?: string;
};

/** "1030" -> {hours:10, minutes:30}; "" / "0" -> null. */
function parseHHMM(raw: unknown): { hours: number; minutes: number } | null {
  const s = String(raw ?? "").trim();
  if (!s || s === "0") return null;
  const padded = s.padStart(4, "0");
  const hours = Number(padded.slice(0, 2));
  const minutes = Number(padded.slice(2, 4));
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return { hours, minutes };
}

function formatHHMM(t: { hours: number; minutes: number }): string {
  return `${String(t.hours).padStart(2, "0")}:${String(t.minutes).padStart(2, "0")}`;
}

function str(v: unknown): string | undefined {
  const s = typeof v === "string" ? v.trim() : v != null ? String(v).trim() : "";
  return s ? s : undefined;
}

/**
 * Mappa una riga grezza `mie__programmate` di UnoERP a un Job. Ritorna null
 * per le righe da scartare: nessun `dal` (non programmata) o nessun
 * `id_prot` (non tracciabile/deduplicabile).
 */
export function mapUnoErpActivity(raw: UnoErpRawActivity): MappedUnoErpJob | null {
  const dalRaw = raw.dal;
  if (dalRaw == null || dalRaw === 0 || String(dalRaw) === "0" || String(dalRaw).trim() === "") return null;
  const dalNum = Number(dalRaw);
  if (!Number.isFinite(dalNum) || dalNum <= 0) return null;

  const unoerpId = str(raw.id_prot);
  if (!unoerpId) return null;

  // `dal` è un timestamp Unix per la mezzanotte di quel giorno *in orario
  // italiano* — leggere Y/M/D nel fuso di Roma (non quello del server) è ciò
  // che mantiene la data corretta indipendentemente dal fuso del server.
  const { year, month, day } = zonedYearMonthDay(new Date(dalNum * 1000), APP_TIME_ZONE);
  const startTime = parseHHMM(raw.dalle);
  const programmatoIl = startTime
    ? zonedTimeToUtc(year, month, day, startTime.hours, startTime.minutes, APP_TIME_ZONE)
    : zonedTimeToUtc(year, month, day, 0, 0, APP_TIME_ZONE);

  // La fascia oraria dell'intervento serve solo per occupare lo slot giusto
  // in calendario: la si accetta solo se `alle` è valido ed è dopo `dalle`
  // (un `alle` mancante o incoerente, es. a cavallo di mezzanotte, lascia il
  // Job senza fascia — ricade sul blocco-istante di default).
  const endTime = parseHHMM(raw.alle);
  const hasFascia =
    startTime && endTime && endTime.hours * 60 + endTime.minutes > startTime.hours * 60 + startTime.minutes;

  return {
    unoerpId,
    titolo: str(raw.oggetto) ?? "(senza oggetto)",
    cliente: str(raw.anagrafica),
    programmatoIl,
    note: str(raw.note),
    categoria: str(raw.categoria),
    priorita: str(raw.txt_priorita),
    oraInizio: hasFascia ? formatHHMM(startTime) : undefined,
    oraFine: hasFascia ? formatHHMM(endTime) : undefined,
  };
}
