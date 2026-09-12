import { NextResponse } from "next/server";
import { checkUpcomingDeadlines } from "@/lib/notify";

/**
 * Innescata dallo scheduling orario in instrumentation.ts (chiamata di
 * loopback), mai da un utente — autenticata con un secret condiviso, non con
 * una sessione. Stesso pattern di /api/unoerp/cron.
 */
export async function POST(req: Request) {
  const secret = process.env.NOTIFICHE_CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const result = await checkUpcomingDeadlines();
  return NextResponse.json({ ok: true, ...result });
}
