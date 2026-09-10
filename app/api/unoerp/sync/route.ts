import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { runUnoErpSync } from "@/lib/unoerp/sync";

const MIN_INTERVAL_MS = 5 * 60 * 1000;

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const creds = await prisma.unoErpCredential.findUnique({
    where: { userId: session.user.id },
    select: { lastSyncAt: true, lastSyncStatus: true },
  });
  if (!creds) return NextResponse.json({ error: "not_connected" }, { status: 400 });

  if (creds.lastSyncStatus === "running") {
    return NextResponse.json({ error: "already_running" }, { status: 409 });
  }

  if (creds.lastSyncAt) {
    const elapsedMs = Date.now() - creds.lastSyncAt.getTime();
    if (elapsedMs < MIN_INTERVAL_MS) {
      return NextResponse.json(
        { error: "rate_limited", retryAfterSec: Math.ceil((MIN_INTERVAL_MS - elapsedMs) / 1000) },
        { status: 429 }
      );
    }
  }

  // Lanciata senza attendere: la risposta torna subito, il client fa polling
  // su /api/unoerp/sync/status per sapere quando finisce.
  void runUnoErpSync(session.user.id).then((result) => {
    if (!result.ok) console.error("[unoerp-sync] failed:", result.error);
  });

  return NextResponse.json({ started: true });
}
