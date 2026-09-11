import type { WebSocket } from "ws";

// Il registro delle connessioni deve stare su `globalThis`, non in una
// variabile di modulo: `server.ts` (eseguito direttamente da tsx) e le
// Server Action (compilate nel bundle di Next) sono due sistemi di moduli
// distinti — un `Map` a livello di modulo finirebbe duplicato, non
// condiviso, fra i due. `globalThis` è l'unico oggetto davvero unico per
// processo, indipendentemente da come ciascun file è stato caricato: stesso
// motivo per cui `lib/prisma.ts` fa lo stesso trucco per il singleton in dev.
type RealtimeGlobal = typeof globalThis & {
  __workerpRealtimeConnections?: Map<string, Set<WebSocket>>;
};

const g = globalThis as RealtimeGlobal;

function connections(): Map<string, Set<WebSocket>> {
  if (!g.__workerpRealtimeConnections) {
    g.__workerpRealtimeConnections = new Map();
  }
  return g.__workerpRealtimeConnections;
}

export function registerConnection(userId: string, ws: WebSocket) {
  const map = connections();
  let set = map.get(userId);
  if (!set) {
    set = new Set();
    map.set(userId, set);
  }
  set.add(ws);
}

export function unregisterConnection(userId: string, ws: WebSocket) {
  const map = connections();
  const set = map.get(userId);
  if (!set) return;
  set.delete(ws);
  if (set.size === 0) map.delete(userId);
}

export type RealtimeEvent =
  | { type: "counts"; attivita: number; lavori: number }
  | { type: "chat:message"; conversationId: string; message: unknown }
  | { type: "chat:unread"; conversationId: string };

export function sendToUser(userId: string, event: RealtimeEvent) {
  const set = connections().get(userId);
  if (!set || set.size === 0) return;
  const payload = JSON.stringify(event);
  for (const ws of set) {
    if (ws.readyState === ws.OPEN) ws.send(payload);
  }
}

export function sendToUsers(userIds: string[], event: RealtimeEvent) {
  for (const userId of userIds) sendToUser(userId, event);
}
