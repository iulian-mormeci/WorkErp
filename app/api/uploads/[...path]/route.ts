import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { readUpload } from "@/lib/storage";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const session = await getSession();
  if (!session) {
    return new Response("Non autorizzato", { status: 401 });
  }

  const { path: segments } = await params;
  const file = await readUpload(segments.join("/"));
  if (!file) {
    return new Response("Non trovato", { status: 404 });
  }

  return new Response(new Uint8Array(file.data), {
    headers: { "Content-Type": file.contentType },
  });
}
