import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { disconnectUnoErp } from "@/lib/unoerp/sync";

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    await disconnectUnoErp(session.user.id);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "disconnect_failed" },
      { status: 500 }
    );
  }
}
