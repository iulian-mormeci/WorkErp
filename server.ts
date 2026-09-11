// Server Node custom al posto di `next start`: l'unico modo per agganciare
// un WebSocket (usato da badge, chat e in futuro notifiche in-app) restando
// in un solo processo/container, senza un servizio sidecar separato — Caddy
// fa già passare in trasparenza gli upgrade verso `app:3000`, quindi questo
// cambio non richiede toccare Caddyfile/CI. Vedi lib/realtime/hub.ts per il
// motivo per cui il registro delle connessioni vive su `globalThis`.
// Con `next dev`/`next start` il caricamento di `.env` è automatico (lo fa
// il CLI di Next prima di richiedere qualunque modulo). Bypassando il CLI
// con un server custom quel caricamento va fatto a mano, e prima di ogni
// altro import: `lib/prisma.ts` legge `DATABASE_URL` al momento in cui il
// modulo viene caricato, non quando viene chiamato.
import "dotenv/config";
import { createServer } from "node:http";
import next from "next";
import { WebSocketServer, type WebSocket } from "ws";
import { authenticateUpgrade } from "@/lib/realtime/authenticate-upgrade";
import { registerConnection, unregisterConnection } from "@/lib/realtime/hub";

const dev = process.env.NODE_ENV !== "production";
const port = Number(process.env.PORT ?? 3000);

const app = next({ dev });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const upgradeHandler = app.getUpgradeHandler();
  const wss = new WebSocketServer({ noServer: true });

  const server = createServer((req, res) => {
    void handler(req, res);
  });

  server.on("upgrade", async (req, socket, head) => {
    const pathname = new URL(req.url ?? "/", "http://localhost").pathname;

    if (pathname !== "/ws") {
      // Non nostro: lascia gestire a Next (es. l'HMR di sviluppo passa da qui).
      await upgradeHandler(req, socket, head);
      return;
    }

    const userId = await authenticateUpgrade(req.headers.cookie).catch(() => null);
    if (!userId) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req, userId);
    });
  });

  wss.on("connection", (ws: WebSocket, _req: unknown, userId: string) => {
    registerConnection(userId, ws);
    ws.on("close", () => unregisterConnection(userId, ws));
    ws.on("error", () => unregisterConnection(userId, ws));
  });

  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port} (dev=${dev})`);
  });
});
