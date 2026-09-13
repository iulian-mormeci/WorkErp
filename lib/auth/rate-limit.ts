// Rate limiter in memoria, apposta: un solo processo Node (server.ts) serve
// l'intera app, niente Redis/servizi esterni necessari. Le voci scadute
// vengono ripulite solo quando la mappa cresce, non con un timer a parte.
const WINDOW_MS = 15 * 60 * 1000; // 15 minuti
const MAX_ENTRIES_BEFORE_PRUNE = 10_000;

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function prune(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

/**
 * Conta un tentativo per `key` in una finestra di `windowMs` (default 15
 * minuti) e dice se è ancora permesso restare sotto `maxAttempts`. Il
 * conteggio scatta ad ogni chiamata, indipendentemente dall'esito
 * dell'operazione che la circonda — sta a chi chiama resettarlo (vedi
 * `resetRateLimit`) quando il tentativo va a buon fine.
 */
export function checkRateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number = WINDOW_MS
): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  if (buckets.size > MAX_ENTRIES_BEFORE_PRUNE) prune(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (bucket.count >= maxAttempts) {
    return { allowed: false, retryAfterMs: bucket.resetAt - now };
  }

  bucket.count++;
  return { allowed: true, retryAfterMs: 0 };
}

export function resetRateLimit(key: string) {
  buckets.delete(key);
}
