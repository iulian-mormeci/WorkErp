import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runUnoErpSync } from "@/lib/unoerp/sync";

const MAX_CONCURRENT = 5;
/** Non rilancia una sync ancora "running" da meno di ~10 minuti. */
const SKIP_IF_RUNNING_WITHIN_MS = 10 * 60 * 1000;

/**
 * Innescata dallo scheduling orario in instrumentation.ts (chiamata di
 * loopback), mai da un utente — autenticata con un secret condiviso, non con
 * una sessione. Esegue la sync per ogni utente connesso.
 */
export async function POST(req: Request) {
  const secret = process.env.UNOERP_CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  void runCronSync();
  return NextResponse.json({ started: true });
}

async function runCronSync() {
  const rows = await prisma.unoErpCredential.findMany({
    select: { userId: true, lastSyncAt: true, lastSyncStatus: true },
  });

  const now = Date.now();
  const candidates = rows.filter((r) => {
    if (r.lastSyncStatus === "running" && r.lastSyncAt) {
      const elapsed = now - r.lastSyncAt.getTime();
      if (elapsed < SKIP_IF_RUNNING_WITHIN_MS) return false;
    }
    return true;
  });

  console.log(`[unoerp-cron] starting: ${candidates.length} user(s)`);

  for (let i = 0; i < candidates.length; i += MAX_CONCURRENT) {
    const batch = candidates.slice(i, i + MAX_CONCURRENT);
    const results = await Promise.allSettled(batch.map((r) => runUnoErpSync(r.userId)));
    for (const result of results) {
      if (result.status === "rejected") {
        console.error("[unoerp-cron] sync threw:", result.reason);
      } else if (!result.value.ok) {
        console.error("[unoerp-cron] sync failed:", result.value.error);
      }
    }
  }

  console.log("[unoerp-cron] finished");
}
