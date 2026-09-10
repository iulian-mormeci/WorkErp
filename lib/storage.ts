import { randomBytes } from "crypto";
import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";

// Volume Docker locale in produzione (vedi docker-compose.prod.yml); su disco
// in dev. `turbopackIgnore` evita che il valore dinamico (da env var) faccia
// tracciare a Next l'intero progetto come possibile file da includere.
const UPLOADS_DIR = path.resolve(
  /* turbopackIgnore: true */ process.env.UPLOADS_DIR ?? "./data/uploads"
);

const MIME_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".txt": "text/plain",
  ".md": "text/markdown",
};

function safeFilename(originalName: string) {
  const ext = path.extname(originalName).toLowerCase();
  return `${randomBytes(16).toString("hex")}${ext}`;
}

// Ritorna il path relativo (da salvare in DB) del file scritto sotto subdir.
export async function saveUpload(file: File, subdir: string) {
  const dir = path.join(UPLOADS_DIR, subdir);
  await mkdir(dir, { recursive: true });

  const filename = safeFilename(file.name);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);

  return path.join(subdir, filename);
}

export async function deleteUpload(relativePath: string) {
  const resolved = resolveUploadPath(relativePath);
  if (!resolved) return;
  await unlink(resolved).catch(() => {});
}

// Risolve un path relativo garantendo che resti dentro UPLOADS_DIR (niente path traversal).
export function resolveUploadPath(relativePath: string) {
  const resolved = path.resolve(UPLOADS_DIR, relativePath);
  if (!resolved.startsWith(UPLOADS_DIR + path.sep)) {
    return null;
  }
  return resolved;
}

export async function readUpload(relativePath: string) {
  const resolved = resolveUploadPath(relativePath);
  if (!resolved) return null;

  const ext = path.extname(resolved).toLowerCase();
  const contentType = MIME_TYPES[ext] ?? "application/octet-stream";

  try {
    const data = await readFile(resolved);
    return { data, contentType };
  } catch {
    return null;
  }
}
