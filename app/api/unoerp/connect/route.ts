import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { authenticateUnoErp } from "@/lib/unoerp/client";
import { encryptToken } from "@/lib/unoerp/crypto";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as
    | { baseUrl?: string; username?: string; password?: string }
    | null;
  const baseUrl = body?.baseUrl?.trim().replace(/\/+$/, "");
  const username = body?.username?.trim();
  const password = body?.password ?? "";

  if (!baseUrl || !username || !password) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  if (!/^https:\/\//i.test(baseUrl)) {
    return NextResponse.json({ error: "https_required" }, { status: 400 });
  }

  const result = await authenticateUnoErp(baseUrl, username, password);
  if (!result.ok) {
    return NextResponse.json({ error: "auth_failed" }, { status: 401 });
  }

  const { encrypted, iv } = encryptToken(result.auth);

  await prisma.unoErpCredential.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      baseUrl,
      tokenEncrypted: encrypted,
      tokenIv: iv,
      lastAuthAt: new Date(),
    },
    update: {
      baseUrl,
      tokenEncrypted: encrypted,
      tokenIv: iv,
      lastAuthAt: new Date(),
      lastSyncStatus: null,
      lastSyncError: null,
    },
  });

  return NextResponse.json({ success: true });
}
