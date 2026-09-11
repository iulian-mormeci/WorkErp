import { prisma } from "@/lib/prisma";
import { decryptToken } from "@/lib/unoerp/crypto";
import { fetchAllMieProgrammate } from "@/lib/unoerp/client";
import { mapUnoErpActivity } from "@/lib/unoerp/mapping";

const SYNC_TOTAL_TIMEOUT_MS = 5 * 60 * 1000;

export type UnoErpSyncResult = { ok: true; count: number } | { ok: false; error: string };

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("sync_timeout")), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

async function performSync(userId: string, baseUrl: string, tokenEncrypted: string, tokenIv: string) {
  const auth = decryptToken(tokenEncrypted, tokenIv);
  const rawRows = await fetchAllMieProgrammate(baseUrl, auth);

  const mapped = rawRows.map(mapUnoErpActivity).filter((m): m is NonNullable<typeof m> => m !== null);
  const seenUnoErpIds = new Set(mapped.map((m) => m.unoerpId));

  for (const m of mapped) {
    await prisma.job.upsert({
      where: { userId_unoerpId: { userId, unoerpId: m.unoerpId } },
      create: {
        userId,
        unoerpId: m.unoerpId,
        origine: "UNOERP",
        stato: "programmato",
        titolo: m.titolo,
        cliente: m.cliente ?? null,
        programmatoIl: m.programmatoIl,
        note: m.note ?? null,
        categoria: m.categoria ?? null,
        priorita: m.priorita ?? null,
        oraInizio: m.oraInizio ?? null,
        oraFine: m.oraFine ?? null,
      },
      // Non tocca `stato`: è l'avanzamento che l'utente segna a mano e una
      // sync (specialmente quella oraria automatica) non deve azzerarlo.
      update: {
        titolo: m.titolo,
        cliente: m.cliente ?? null,
        programmatoIl: m.programmatoIl,
        note: m.note ?? null,
        categoria: m.categoria ?? null,
        priorita: m.priorita ?? null,
        oraInizio: m.oraInizio ?? null,
        oraFine: m.oraFine ?? null,
      },
    });
  }

  // Un Job UnoERP non più presente nella risposta è stato chiuso/riassegnato
  // lato ERP — rimuove solo i Job di origine UNOERP, mai quelli manuali.
  await prisma.job.deleteMany({
    where: {
      userId,
      origine: "UNOERP",
      unoerpId: { notIn: [...seenUnoErpIds], not: null },
    },
  });

  return { count: mapped.length };
}

/**
 * Esegue una sync completa per un utente: legge le credenziali, scarica
 * `mie__programmate` da UnoERP, aggiorna i Job, aggiorna lo stato di sync
 * sulle credenziali per l'intera durata. Condivisa dalla route on-demand
 * `/api/unoerp/sync` e dal cron orario.
 */
export async function runUnoErpSync(userId: string): Promise<UnoErpSyncResult> {
  const creds = await prisma.unoErpCredential.findUnique({ where: { userId } });
  if (!creds) return { ok: false, error: "not_connected" };

  await prisma.unoErpCredential.update({
    where: { userId },
    data: { lastSyncStatus: "running" },
  });

  try {
    const result = await withTimeout(
      performSync(userId, creds.baseUrl, creds.tokenEncrypted, creds.tokenIv),
      SYNC_TOTAL_TIMEOUT_MS
    );

    await prisma.unoErpCredential.update({
      where: { userId },
      data: {
        lastSyncAt: new Date(),
        lastSyncStatus: "success",
        lastSyncCount: result.count,
        lastSyncError: null,
      },
    });

    return { ok: true, count: result.count };
  } catch (e) {
    const message = (e instanceof Error ? e.message : String(e)).slice(0, 500);
    await prisma.unoErpCredential.update({
      where: { userId },
      data: { lastSyncAt: new Date(), lastSyncStatus: "error", lastSyncError: message },
    });
    return { ok: false, error: message };
  }
}

/** Rimuove ogni Job sincronizzato e le credenziali salvate per questo utente. */
export async function disconnectUnoErp(userId: string): Promise<void> {
  await prisma.job.deleteMany({ where: { userId, origine: "UNOERP" } });
  await prisma.unoErpCredential.delete({ where: { userId } });
}
