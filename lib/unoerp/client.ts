import { assertPublicHttpsUrl } from "@/lib/security/ssrf";

const UNOERP_CALL_TIMEOUT_MS = 30_000;
const PAGE_PAUSE_MS = 300;

// `url` incorpora il baseUrl scelto dall'utente in Impostazioni: verificato
// ad ogni chiamata (non solo al momento della connessione) per non essere
// aggirabile con un DNS rebinding fra il connect e una sync successiva.
// `redirect: "manual"` impedisce a fetch di seguire da solo un redirect verso
// un host non verificato: senza, un endpoint malevolo (o compromesso)
// potrebbe rispondere con un 3xx verso un indirizzo interno e aggirare del
// tutto il controllo appena fatto sull'URL originale.
async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  await assertPublicHttpsUrl(url);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, redirect: "manual", signal: controller.signal });
    if (res.type === "opaqueredirect" || (res.status >= 300 && res.status < 400)) {
      throw new Error("unexpected_redirect");
    }
    return res;
  } finally {
    clearTimeout(timer);
  }
}

export type UnoErpAuthResult =
  | { ok: true; auth: string; uid: string }
  | { ok: false; error: string };

/** Scambio Basic-auth contro `{baseUrl}/intranet/api.php`, verificato contro un'istanza reale. */
export async function authenticateUnoErp(
  baseUrl: string,
  username: string,
  password: string
): Promise<UnoErpAuthResult> {
  const basic = Buffer.from(`${username}:${password}`).toString("base64");
  try {
    const res = await fetchWithTimeout(
      `${baseUrl}/intranet/api.php`,
      { method: "POST", headers: { Authorization: `Basic ${basic}` } },
      UNOERP_CALL_TIMEOUT_MS
    );
    if (!res.ok) return { ok: false, error: `http_${res.status}` };
    const body = (await res.json().catch(() => null)) as { auth?: string; uid?: string } | null;
    if (!body?.auth) return { ok: false, error: "auth_failed" };
    return { ok: true, auth: body.auth, uid: String(body.uid ?? "") };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "network_error" };
  }
}

export type UnoErpRawActivity = Record<string, unknown>;

async function fetchAttivitaPage(
  baseUrl: string,
  auth: string,
  page: number
): Promise<{ rows: UnoErpRawActivity[]; totalPages: number }> {
  const params = new URLSearchParams();
  params.set("auth", auth);
  params.set("act", "index");
  params.set("module", "Risorse");
  params.set("file", "attivita_da_lavorare");
  if (page > 1) params.set("pages[mie__programmate]", String(page));

  const res = await fetchWithTimeout(
    `${baseUrl}/intranet/api.php`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    },
    UNOERP_CALL_TIMEOUT_MS
  );
  if (!res.ok) throw new Error(`UnoERP HTTP ${res.status}`);
  const body = (await res.json()) as {
    data?: { mie__programmate?: UnoErpRawActivity[] };
    tot_pagine?: { mie__programmate?: number | string };
  };
  const rows = body.data?.mie__programmate ?? [];
  const totalPages = Number(body.tot_pagine?.mie__programmate ?? 1) || 1;
  return { rows, totalPages };
}

/**
 * Scarica tutte le pagine della sola sezione `mie__programmate` — ogni altra
 * sezione della risposta (ticket, altri__programmate, non_assegnate, ecc.) è
 * ignorata, per lo scope di questa integrazione (le attività assegnate e
 * programmate per l'utente connesso).
 */
export async function fetchAllMieProgrammate(baseUrl: string, auth: string): Promise<UnoErpRawActivity[]> {
  const all: UnoErpRawActivity[] = [];
  let page = 1;
  for (;;) {
    const { rows, totalPages } = await fetchAttivitaPage(baseUrl, auth, page);
    all.push(...rows);
    if (page >= totalPages) break;
    page += 1;
    await new Promise((resolve) => setTimeout(resolve, PAGE_PAUSE_MS));
  }
  return all;
}
