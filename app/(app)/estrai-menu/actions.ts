"use server";

import { requireUser } from "@/lib/auth/session";
import { extractMenuFromPdf, type MenuItem } from "@/lib/menu-pdf";

export type MenuExtractState =
  | { error: string }
  | { items: MenuItem[]; warnings: string[] }
  | undefined;

// Limite più stretto del tetto globale upload (100MB, vedi lib/storage.ts):
// l'estrazione gira in sincrono nella request e l'OCR di molte pagine può
// richiedere secondi a pagina, quindi si tiene un file di menu ragionevole.
const MAX_MENU_PDF_BYTES = 20 * 1024 * 1024;

export async function extractMenuPdf(
  _prevState: MenuExtractState,
  formData: FormData
): Promise<MenuExtractState> {
  await requireUser();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Seleziona un PDF da caricare." };
  }
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return { error: "Il file deve essere un PDF." };
  }
  if (file.size > MAX_MENU_PDF_BYTES) {
    return { error: "Il PDF supera i 20MB consentiti." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const { items, warnings } = await extractMenuFromPdf(buffer);
    if (items.length === 0) {
      return {
        error:
          "Non è stato riconosciuto nessun prodotto in questo PDF. Prova con un altro file o controlla che contenga davvero un elenco di prodotti e prezzi.",
      };
    }
    return { items, warnings };
  } catch {
    return { error: "Lettura del PDF non riuscita. Il file potrebbe essere danneggiato o protetto." };
  }
}
