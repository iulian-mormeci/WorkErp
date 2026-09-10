import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const creds = await prisma.unoErpCredential.findUnique({
    where: { userId: session.user.id },
    select: {
      baseUrl: true,
      lastSyncAt: true,
      lastSyncStatus: true,
      lastSyncCount: true,
      lastSyncError: true,
    },
  });

  if (!creds) return NextResponse.json({ connected: false });

  return NextResponse.json({
    connected: true,
    baseUrl: creds.baseUrl,
    lastSyncAt: creds.lastSyncAt,
    lastSyncStatus: creds.lastSyncStatus,
    lastSyncCount: creds.lastSyncCount,
    lastSyncError: creds.lastSyncError,
  });
}
