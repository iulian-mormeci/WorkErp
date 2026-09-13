import { spawn } from "child_process";
import { mkdtemp, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import path from "path";

export type MenuItem = { categoria: string; prodotto: string; prezzo: number };
export type MenuExtractionResult = { items: MenuItem[]; warnings: string[] };

const WORKER_SCRIPT = path.join(process.cwd(), "scripts", "extract-menu-worker.ts");
// Path diretto (non `require.resolve`) apposta: un require/import con
// specifier letterale verrebbe tracciato e impacchettato dal bundler di
// Next, che poi fallisce a risolvere un binario CLI a runtime — qui serve
// solo il percorso su disco, mai un vero require del modulo.
const TSX_CLI = path.join(process.cwd(), "node_modules", "tsx", "dist", "cli.mjs");

/**
 * Legge un PDF di menu (testo digitale e/o pagine scansionate/foto, in
 * qualunque combinazione) e ne ricava una lista di prodotti con prezzo e
 * categoria. Tutto in locale: `pdf-parse` per il testo, OCR (tesseract, già
 * installato nel container) sulle pagine senza testo. Nessun servizio
 * esterno — di conseguenza, su menu con layout complessi (multi-colonna,
 * voci su più righe non standard) il risultato può contenere errori: va
 * sempre rivisto prima dell'uso.
 *
 * Il lavoro vero e proprio gira in un processo figlio (scripts/extract-menu-worker.ts)
 * invece che in-process: pdf-parse (pdfjs-dist) prova a caricare il proprio
 * worker con un import dinamico che, dentro il bundle server di una Server
 * Action, punta a un chunk inesistente — fuori dal bundle, in un processo
 * Node avviato con lo stesso tsx già usato in produzione per server.ts, la
 * risoluzione dei moduli funziona normalmente.
 */
export async function extractMenuFromPdf(buffer: Buffer): Promise<MenuExtractionResult> {
  const dir = await mkdtemp(path.join(tmpdir(), "menu-pdf-"));
  const pdfPath = path.join(dir, "menu.pdf");
  try {
    await writeFile(pdfPath, buffer);
    const output = await runWorker(pdfPath);
    const parsed = JSON.parse(output) as MenuExtractionResult | { error: string };
    if ("error" in parsed) throw new Error(parsed.error);
    return parsed;
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

function runWorker(pdfPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(process.execPath, [TSX_CLI, WORKER_SCRIPT, pdfPath]);
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (chunk) => (stdout += chunk));
    proc.stderr.on("data", (chunk) => (stderr += chunk));
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0 && stdout) resolve(stdout);
      else reject(new Error(stderr || stdout || `processo di estrazione uscito con codice ${code}`));
    });
  });
}
