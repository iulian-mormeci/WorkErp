import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE } from "@/lib/auth/constants";

// Fuori da una request Next non c'è l'API `cookies()` (serve un request
// context) — stesso lookup di `getSession()` in lib/auth/session.ts, ma con
// il cookie letto a mano dall'header grezzo della richiesta di upgrade.
function parseCookie(header: string | undefined, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1) continue;
    const key = part.slice(0, separator).trim();
    if (key === name) return decodeURIComponent(part.slice(separator + 1).trim());
  }
  return null;
}

export async function authenticateUpgrade(cookieHeader: string | undefined): Promise<string | null> {
  const sessionId = parseCookie(cookieHeader, SESSION_COOKIE);
  if (!sessionId) return null;

  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session || session.expiresAt < new Date()) return null;

  return session.userId;
}
