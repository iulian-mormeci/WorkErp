"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Eye, EyeOff, Loader2, Plug, RefreshCw } from "lucide-react";

type SyncStatus = "success" | "error" | "running" | null;

type StatusResponse =
  | { connected: false }
  | {
      connected: true;
      baseUrl: string;
      lastSyncAt: string | null;
      lastSyncStatus: SyncStatus;
      lastSyncCount: number;
      lastSyncError: string | null;
    };

const POLL_INTERVAL_MS = 3000;
const POLL_MAX_MS = 6 * 60 * 1000;

const CONNECT_ERROR_LABEL: Record<string, string> = {
  invalid_input: "Compila tutti i campi.",
  https_required: "L'URL deve iniziare con https://.",
  auth_failed: "Credenziali non valide.",
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("it-IT", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function UnoErpCard() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<StatusResponse>({ connected: false });

  const [baseUrl, setBaseUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);
  const [confirmingDisconnect, setConfirmingDisconnect] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function loadStatus() {
    const res = await fetch("/api/unoerp/sync/status");
    const data = (await res.json()) as StatusResponse;
    setStatus(data);
    return data;
  }

  useEffect(() => {
    void (async () => {
      await loadStatus();
      setLoading(false);
    })();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  async function handleConnect() {
    if (connecting) return;
    setConnectError(null);

    if (!baseUrl.trim() || !username.trim() || !password) {
      setConnectError(CONNECT_ERROR_LABEL.invalid_input);
      return;
    }
    if (!/^https:\/\//i.test(baseUrl.trim())) {
      setConnectError(CONNECT_ERROR_LABEL.https_required);
      return;
    }

    setConnecting(true);
    try {
      const res = await fetch("/api/unoerp/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseUrl: baseUrl.trim(), username: username.trim(), password }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !data.success) {
        setConnectError(CONNECT_ERROR_LABEL[data.error ?? ""] ?? "Connessione non riuscita.");
        return;
      }
      setPassword("");
      await loadStatus();
    } catch {
      setConnectError("Connessione non riuscita.");
    } finally {
      setConnecting(false);
    }
  }

  function startPolling() {
    if (pollRef.current) clearInterval(pollRef.current);
    let elapsed = 0;
    pollRef.current = setInterval(async () => {
      elapsed += POLL_INTERVAL_MS;
      const data = await loadStatus();
      const terminal = data.connected && (data.lastSyncStatus === "success" || data.lastSyncStatus === "error");
      if (!terminal && elapsed < POLL_MAX_MS) return;

      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
      setSyncing(false);

      if (data.connected && data.lastSyncStatus === "success") {
        setSyncMessage(`Sincronizzati ${data.lastSyncCount} lavori.`);
      } else if (data.connected && data.lastSyncStatus === "error") {
        setSyncMessage(`Sync fallita: ${data.lastSyncError ?? "errore sconosciuto"}`);
      } else {
        setSyncMessage("Sync non completata, riprova.");
      }
    }, POLL_INTERVAL_MS);
  }

  async function handleSyncNow() {
    if (syncing) return;
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await fetch("/api/unoerp/sync", { method: "POST" });
      const data = (await res.json()) as { started?: boolean; error?: string };
      if (!res.ok || !data.started) {
        setSyncing(false);
        setSyncMessage(
          data.error === "rate_limited"
            ? "Aspetta qualche minuto prima di risincronizzare."
            : data.error === "already_running"
              ? "Una sync è già in corso."
              : "Sync non avviata."
        );
        return;
      }
      startPolling();
    } catch {
      setSyncing(false);
      setSyncMessage("Sync non avviata.");
    }
  }

  async function handleDisconnect() {
    if (disconnecting) return;
    setDisconnecting(true);
    try {
      const res = await fetch("/api/unoerp/disconnect", { method: "POST" });
      const data = (await res.json()) as { success?: boolean };
      if (res.ok && data.success) {
        setBaseUrl("");
        setUsername("");
        setPassword("");
        setSyncMessage(null);
        await loadStatus();
        setConfirmingDisconnect(false);
      }
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium text-ink">UnoERP</h2>
          <p className="mt-0.5 text-sm text-muted">
            Sincronizza i lavori assegnati e programmati dal tuo account UnoERP.
          </p>
        </div>
        <Plug className="size-4 shrink-0 text-muted" />
      </div>

      <div className="mt-4">
        {loading ? (
          <p className="text-sm text-muted">…</p>
        ) : !status.connected ? (
          <div className="flex flex-col gap-3">
            <div className="space-y-1">
              <label className="text-sm text-muted">URL istanza</label>
              <input
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://tuaazienda.unoerp.it"
                inputMode="url"
                className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-pine"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-muted">Nome utente</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-pine"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-muted">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="w-full rounded-md border border-line bg-paper px-3 py-2 pr-10 text-sm text-ink outline-none focus:border-pine"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Nascondi password" : "Mostra password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {connectError && <p className="text-sm text-danger">{connectError}</p>}

            <button
              type="button"
              disabled={connecting}
              onClick={() => void handleConnect()}
              className="flex w-fit items-center gap-2 rounded-md bg-pine-strong px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {connecting && <Loader2 className="size-4 animate-spin" />}
              {connecting ? "Connessione…" : "Connetti"}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <span className="w-fit rounded-full border border-pine/30 bg-pine/10 px-2.5 py-1 text-xs text-pine-strong">
              ✓ Connesso a {status.baseUrl}
            </span>

            {status.lastSyncStatus === "error" && (
              <div className="flex items-start gap-2 rounded-md border border-amber/30 bg-amber/10 px-3 py-2 text-xs text-amber">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <span>{status.lastSyncError}</span>
              </div>
            )}

            <p className="text-xs text-muted">
              {status.lastSyncAt
                ? `Ultima sync: ${formatDateTime(status.lastSyncAt)} · ${status.lastSyncCount} lavori`
                : "Nessuna sync effettuata ancora."}
            </p>

            {syncMessage && <p className="text-xs text-muted">{syncMessage}</p>}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={syncing}
                onClick={() => void handleSyncNow()}
                className="flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm text-ink hover:bg-paper disabled:opacity-50"
              >
                {syncing ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <RefreshCw className="size-4" />
                )}
                {syncing ? "Sincronizzazione…" : "Sincronizza ora"}
              </button>

              {confirmingDisconnect ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted">Disconnettere e rimuovere i lavori sincronizzati?</span>
                  <button
                    type="button"
                    disabled={disconnecting}
                    onClick={() => void handleDisconnect()}
                    className="rounded-md bg-danger px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
                  >
                    Conferma
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingDisconnect(false)}
                    className="text-xs text-muted hover:text-ink"
                  >
                    Annulla
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingDisconnect(true)}
                  className="rounded-md border border-line px-3 py-2 text-sm text-danger hover:bg-paper"
                >
                  Disconnetti
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
