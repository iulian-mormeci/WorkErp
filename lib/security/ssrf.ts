import { isIP } from "node:net";
import { lookup } from "node:dns/promises";

/**
 * L'URL base di UnoERP è scelto dall'utente (Impostazioni) e riusato dal
 * cron per fare richieste HTTP lato server: senza controlli, un utente
 * potrebbe puntarlo a un indirizzo interno/privato (localhost, rete LAN,
 * endpoint metadata cloud) e usare il server come proxy verso quella rete
 * (SSRF). Blocca protocollo non-https, host letteralmente privati/riservati
 * (elenco IANA completo, non solo i più comuni), e — per mitigare il DNS
 * rebinding — anche gli indirizzi a cui il nome a dominio risolve davvero al
 * momento della richiesta, non solo quando l'utente ha collegato l'account.
 *
 * Limite noto: la verifica e la successiva `fetch()` fanno due resolve DNS
 * separati (fetch usa la propria risoluzione interna) — un rebinding con TTL
 * bassissimo cronometrato esattamente in quella finestra di pochi millisecondi
 * per *ogni* richiesta non è escluso al 100%. Accettabile per uno strumento
 * self-hosted a singolo proprietario; una difesa completa richiederebbe di
 * pinnare l'IP risolto al momento della connessione TCP stessa.
 */

type Ipv4Range = { base: string; bits: number };

// RFC 6890 / IANA special-purpose IPv4 registry — non solo le reti private
// più comuni, anche CGNAT, TEST-NET, benchmark, multicast e riservato.
const IPV4_BLOCKED_RANGES: Ipv4Range[] = [
  { base: "0.0.0.0", bits: 8 }, // "this network"
  { base: "10.0.0.0", bits: 8 }, // privata
  { base: "100.64.0.0", bits: 10 }, // CGNAT / shared address space
  { base: "127.0.0.0", bits: 8 }, // loopback
  { base: "169.254.0.0", bits: 16 }, // link-local / metadata cloud
  { base: "172.16.0.0", bits: 12 }, // privata
  { base: "192.0.0.0", bits: 24 }, // IETF protocol assignments
  { base: "192.0.2.0", bits: 24 }, // TEST-NET-1
  { base: "192.88.99.0", bits: 24 }, // 6to4 relay anycast
  { base: "192.168.0.0", bits: 16 }, // privata
  { base: "198.18.0.0", bits: 15 }, // benchmark
  { base: "198.51.100.0", bits: 24 }, // TEST-NET-2
  { base: "203.0.113.0", bits: 24 }, // TEST-NET-3
  { base: "224.0.0.0", bits: 4 }, // multicast
  { base: "240.0.0.0", bits: 4 }, // riservato + broadcast 255.255.255.255
];

function ipv4ToInt(ip: string): number {
  const parts = ip.split(".").map(Number);
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

function isIpv4InRange(ip: string, range: Ipv4Range): boolean {
  const mask = range.bits === 0 ? 0 : (0xffffffff << (32 - range.bits)) >>> 0;
  return (ipv4ToInt(ip) & mask) === (ipv4ToInt(range.base) & mask);
}

function isPrivateOrReservedIpv4(ip: string): boolean {
  return IPV4_BLOCKED_RANGES.some((range) => isIpv4InRange(ip, range));
}

function isPrivateOrReservedIp(ip: string): boolean {
  const version = isIP(ip);
  if (version === 4) {
    return isPrivateOrReservedIpv4(ip);
  }
  if (version === 6) {
    const lower = ip.toLowerCase();
    if (lower === "::" || lower === "::1") return true; // non specificato / loopback
    if (lower.startsWith("fe80:")) return true; // link-local
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // unique local (fc00::/7)
    if (lower.startsWith("ff")) return true; // multicast (ff00::/8)
    if (lower.startsWith("2001:db8:")) return true; // documentazione
    if (lower.startsWith("::ffff:")) {
      // IPv4-mapped IPv6 — valuta la parte v4 incapsulata.
      const embedded = lower.replace("::ffff:", "");
      return isIP(embedded) === 4 ? isPrivateOrReservedIpv4(embedded) : true;
    }
    if (lower.startsWith("64:ff9b::")) {
      // NAT64 well-known prefix — anche qui c'è un IPv4 incapsulato negli ultimi 32 bit.
      return true;
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

  // Per un letterale IPv6, URL.hostname include le parentesi quadre (es.
  // "[::1]") — vanno tolte prima di riconoscerlo come IP.
  const hostname = url.hostname.replace(/^\[(.+)\]$/, "$1");
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
