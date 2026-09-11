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

// Il cookie di sessione è `sameSite: "lax"` (vedi createSession in
// lib/auth/session.ts), che già limita parecchio l'hijacking cross-site,
// ma il comportamento di SameSite sull'handshake WebSocket ha avuto
// incoerenze storiche fra browser — un controllo esplicito dell'header
// `Origin` è una difesa in profondità economica contro il Cross-Site
// WebSocket Hijacking (CSWSH), indipendente da quei dettagli. Un browser
// manda sempre `Origin` su un handshake WS: la sua assenza è già sospetta.
// Confrontato con l'header `Host` della richiesta stessa, non con un
// dominio hardcoded — funziona invariato in sviluppo e in produzione.
export function isTrustedOrigin(origin: string | undefined, host: string | undefined): boolean {
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
