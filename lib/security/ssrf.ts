import { isIP } from "node:net";
import { lookup } from "node:dns/promises";

/**
 * L'URL base di UnoERP è scelto dall'utente (Impostazioni) e riusato dal
 * cron per fare richieste HTTP lato server: senza controlli, un utente
 * potrebbe puntarlo a un indirizzo interno/privato (localhost, rete LAN,
 * endpoint metadata cloud) e usare il server come proxy verso quella rete
 * (SSRF). Blocca protocollo non-https, host letteralmente privati, e — per
 * mitigare il DNS rebinding — anche gli indirizzi a cui il nome a dominio
 * risolve davvero al momento della richiesta.
 */

function isPrivateOrReservedIp(ip: string): boolean {
  const version = isIP(ip);
  if (version === 4) {
    const parts = ip.split(".").map(Number);
    const [a, b] = parts;
    if (a === 127) return true; // loopback
    if (a === 10) return true; // 10.0.0.0/8
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
    if (a === 192 && b === 168) return true; // 192.168.0.0/16
    if (a === 169 && b === 254) return true; // link-local / cloud metadata
    if (a === 0) return true;
    return false;
  }
  if (version === 6) {
    const lower = ip.toLowerCase();
    if (lower === "::1") return true; // loopback
    if (lower.startsWith("fe80:")) return true; // link-local
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // unique local (fc00::/7)
    if (lower.startsWith("::ffff:")) {
      // IPv4-mapped IPv6 — valuta la parte v4.
      return isPrivateOrReservedIp(lower.replace("::ffff:", ""));
    }
    return false;
  }
  return false;
}

export async function assertPublicHttpsUrl(rawUrl: string): Promise<void> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("invalid_url");
  }

  if (url.protocol !== "https:") {
    throw new Error("https_required");
  }

  const hostname = url.hostname;
  if (hostname === "localhost") {
    throw new Error("host_not_allowed");
  }

  if (isIP(hostname)) {
    if (isPrivateOrReservedIp(hostname)) throw new Error("host_not_allowed");
    return;
  }

  const results = await lookup(hostname, { all: true }).catch(() => []);
  if (results.length === 0) {
    throw new Error("host_not_resolvable");
  }
  if (results.some((r) => isPrivateOrReservedIp(r.address))) {
    throw new Error("host_not_allowed");
  }
}
