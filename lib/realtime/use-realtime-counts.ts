"use client";

import { useEffect, useState } from "react";

export type Counts = { attivita: number; lavori: number };

const RECONNECT_DELAY_MS = 3000;

// Un'unica connessione WS per la sidebar/bottom-nav: badge di Attività e
// Lavori aggiornati in tempo reale mentre la scheda resta aperta. Se la
// connessione cade, i contatori restano quelli dell'ultimo valore noto (il
// server li ha già passati come `initial` al primo render) finché non si
// riconnette.
export function useRealtimeCounts(initial: Counts): Counts {
  const [counts, setCounts] = useState(initial);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let stopped = false;

    function connect() {
      const protocol = window.location.protocol === "https:" ? "wss" : "ws";
      ws = new WebSocket(`${protocol}://${window.location.host}/ws`);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "counts") {
            setCounts({ attivita: data.attivita, lavori: data.lavori });
          }
        } catch {
          // messaggio non valido: ignorato, non è un evento che riguarda i badge.
        }
      };

      ws.onclose = () => {
        if (!stopped) reconnectTimer = setTimeout(connect, RECONNECT_DELAY_MS);
      };
      ws.onerror = () => ws?.close();
    }

    connect();

    return () => {
      stopped = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, []);

  return counts;
}
