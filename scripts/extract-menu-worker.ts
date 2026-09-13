// Eseguito come processo figlio separato (vedi lib/menu-pdf.ts), MAI
// importato direttamente nel bundle server di Next: pdf-parse (pdfjs-dist)
// prova a caricare il proprio worker con un import dinamico che, dentro il
// bundle di una Server Action, punta a un chunk inesistente ("Setting up
// fake worker failed"). Fuori dal bundle, in un processo Node normale
// avviato con tsx, la risoluzione dei moduli funziona come atteso.
import { spawn } from "child_process";
import { mkdtemp, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import { PDFParse } from "pdf-parse";

export type MenuItem = { categoria: string; prodotto: string; prezzo: number };
export type MenuExtractionResult = { items: MenuItem[]; warnings: string[] };

// Sotto questa soglia di caratteri, una pagina si considera priva di
// livello testo (scansione/foto) e si passa all'OCR.
const MIN_TEXT_LENGTH_PER_PAGE = 20;
const DEFAULT_CATEGORY = "Senza categoria";

async function extractMenuFromPdf(buffer: Buffer): Promise<MenuExtractionResult> {
  const parser = new PDFParse({ data: buffer });
  const warnings: string[] = [];
  const pageTexts: string[] = [];

  try {
    const { pages } = await parser.getText();
    for (const page of pages) {
      if (page.text.trim().length >= MIN_TEXT_LENGTH_PER_PAGE) {
        pageTexts.push(page.text);
        continue;
      }
      try {
        const ocrText = await ocrPage(parser, page.num);
        if (!ocrText.trim()) {
          warnings.push(`Pagina ${page.num}: nessun testo riconosciuto (OCR).`);
        }
        pageTexts.push(ocrText);
      } catch {
        warnings.push(`Pagina ${page.num}: lettura OCR non riuscita, pagina saltata.`);
      }
    }
  } finally {
    await parser.destroy();
  }

  const items = parseMenuPages(pageTexts);
  return { items, warnings };
}

async function ocrPage(parser: PDFParse, pageNumber: number): Promise<string> {
  const { pages } = await parser.getScreenshot({
    partial: [pageNumber],
    scale: 2,
    imageBuffer: true,
    imageDataUrl: false,
  });
  const png = pages[0]?.data;
  if (!png) return "";

  const dir = await mkdtemp(path.join(tmpdir(), "menu-ocr-"));
  const imgPath = path.join(dir, "page.png");
  try {
    await writeFile(imgPath, png);
    return await runTesseract(imgPath);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

function runTesseract(imagePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn("tesseract", [imagePath, "stdout", "-l", "ita"]);
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (chunk) => (stdout += chunk));
    proc.stderr.on("data", (chunk) => (stderr += chunk));
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) resolve(stdout);
      else reject(new Error(stderr || `tesseract uscito con codice ${code}`));
    });
  });
}

// Un titolo di sezione è quasi sempre corto e di poche parole ("BEVANDE",
// "SECONDI PIATTI"...): un piatto scritto tutto maiuscolo per enfasi (es.
// "ANTIPASTO MISTO DELLA CASA") è invece più lungo e articolato — il numero
// di parole distingue meglio della sola lunghezza (nomi di piatti brevi
// esistono, categorie con più di 3 parole quasi mai).
const CATEGORY_MAX_LEN = 20;
const CATEGORY_MAX_WORDS = 3;
// Le tabelle allergeni nei menu italiani hanno oggi 14 voci standard (reg.
// UE 1169/2011) — un numero fuori da questo range non è quasi mai un
// riferimento ad allergene ma parte del prezzo/altro.
const ALLERGEN_MAX = 14;

// Prezzo isolato sulla propria riga (menu con blocco nomi + blocco prezzi
// separato, comune nei layout grafici) — es. "€ 9,00".
const PRICE_ONLY_RE = /^€?\s*(\d{1,4}(?:[.,]\d{2})?)\s*€?$/;
const VARIABLE_PRICE_RE = /^prezzo\s+variabile$/i;
// Prezzo in fondo a una riga che contiene anche il nome (formato "riga unica").
const INLINE_PRICE_RE = /(?:€\s*)?(\d{1,4}(?:[.,]\d{2})?)\s*€?\s*$/;
// Formato/quantità di una variante dello stesso prodotto (es. "cl 0,30",
// "1 litro"): il prezzo va abbinato a "nome + variante", non al solo nome.
const VARIANT_RE = /^(?:cl|ml|litr[oi]|l)\s*[\d.,]*$|^[\d.,]+\s*(?:cl|ml|litr[oi]|l)$/i;

function isAllCapsWord(line: string): boolean {
  const letters = line.replace(/[^\p{L}]/gu, "");
  if (letters.length === 0) return false;
  return letters === letters.toUpperCase() && letters !== letters.toLowerCase();
}

function looksLikeCategory(line: string): boolean {
  return (
    line.length <= CATEGORY_MAX_LEN &&
    line.split(" ").filter(Boolean).length <= CATEGORY_MAX_WORDS &&
    !/\d/.test(line) &&
    isAllCapsWord(line)
  );
}

/** "A N T I P A S T I" -> { collapsed: "ANTIPASTI", wasSpaced: true } */
function collapseLetterSpacing(line: string): { collapsed: string; wasSpaced: boolean } {
  const tokens = line.split(" ");
  if (tokens.length < 6) return { collapsed: line, wasSpaced: false };
  const allSingleLetters = tokens.every((t) => /^\p{L}$/u.test(t));
  if (!allSingleLetters) return { collapsed: line, wasSpaced: false };
  // Titolo con letter-spacing grafico (es. "P R I M I ..."): non c'è modo
  // affidabile di recuperare gli spazi tra le parole originali (lo spazio
  // tra lettere e quello tra parole ha la stessa larghezza), si accetta una
  // sola parola unita — comunque riconoscibile, va corretta a mano se serve.
  return { collapsed: tokens.join(""), wasSpaced: true };
}

/**
 * Rimuove dal fondo di un nome i riferimenti agli allergeni (es. "...
 * verdurine marinate 4, 12" o "...porcini* 5") — numeri interi 1-14, con o
 * senza virgola, spesso preceduti da un asterisco. Non tocca un prezzo con
 * decimali (es. "5,50": "50" è fuori dal range allergeni) né liste con
 * numeri fuori range.
 */
function stripAllergenSuffix(line: string): string {
  const match = line.match(/^(.*?)\s*\*?\s*(\d{1,2}(?:\s*,\s*\d{1,2})*)\s*$/);
  if (!match || !match[1].trim()) return line;
  const numbers = match[2].split(",").map((n) => Number(n.trim()));
  if (numbers.some((n) => !Number.isInteger(n) || n < 1 || n > ALLERGEN_MAX)) return line;
  return match[1].trim();
}

/**
 * Alcune righe (intestazione ripetuta, nota su coperto/allergeni...) si
 * ripetono identiche su gran parte delle pagine: si escludono prima del
 * parsing, altrimenti finiscono trattate come falsi prodotti. Un prezzo
 * "tondo" può ripetersi per puro caso (tanti piatti costano uguale) — non
 * conta mai come riga ripetuta da rimuovere.
 */
function removeBoilerplate(pages: string[]): string[] {
  const lineCounts = new Map<string, number>();
  const pageLineSets = pages.map((p) => new Set(p.split("\n").map((l) => l.trim()).filter(Boolean)));
  for (const set of pageLineSets) {
    for (const line of set) lineCounts.set(line, (lineCounts.get(line) ?? 0) + 1);
  }
  const totalPages = pages.length;
  if (totalPages < 3) return pages;
  const threshold = Math.ceil(totalPages * 0.5);
  const boilerplate = new Set(
    [...lineCounts.entries()]
      .filter(([line, c]) => c >= threshold && line.length >= 8 && !PRICE_ONLY_RE.test(line))
      .map(([l]) => l)
  );
  return pages.map((p) =>
    p
      .split("\n")
      .filter((l) => !boilerplate.has(l.trim()))
      .join("\n")
  );
}

/**
 * Parser a euristiche pensato per due formati di menu comuni:
 * 1. "riga unica": nome e prezzo sulla stessa riga (es. "Pizza ... 7,50").
 * 2. "a blocchi": tutti i nomi di una sezione, poi tutti i relativi prezzi
 *    in un blocco separato (frequente nei menu impaginati graficamente,
 *    dove l'estrazione del testo restituisce prima l'intera colonna dei
 *    nomi e poi quella dei prezzi) — i nomi vengono abbinati ai prezzi
 *    nello stesso ordine in cui compaiono.
 * Il formato viene rilevato automaticamente contando quante righe del
 * documento sono "solo prezzo" rispetto al totale.
 *
 * In entrambi i formati: un titolo corto TUTTO MAIUSCOLO (o con lettere
 * spaziate graficamente, es. "P R I M I ...") è una categoria; il resto
 * confluisce nel prodotto in corso.
 *
 * Su layout molto complessi (più colonne, tabelle di varianti con più
 * prezzi per articolo) il risultato può contenere ancora qualche errore —
 * va sempre rivisto prima dell'uso.
 */
function parseMenuPages(pages: string[]): MenuItem[] {
  const cleanedPages = removeBoilerplate(pages);
  const rawLines = cleanedPages
    .join("\n")
    .split("\n")
    .map((l) => l.replace(/[.\-_]{2,}/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean);

  let priceOnlyCount = 0;
  let nameCandidateCount = 0;
  for (const line of rawLines) {
    const { wasSpaced } = collapseLetterSpacing(line);
    if (wasSpaced || looksLikeCategory(line)) continue;
    if (PRICE_ONLY_RE.test(line) || VARIABLE_PRICE_RE.test(line)) priceOnlyCount++;
    else nameCandidateCount++;
  }
  const blocksMode = priceOnlyCount >= Math.max(3, nameCandidateCount * 0.3);

  const items: MenuItem[] = [];
  let currentCategory = DEFAULT_CATEGORY;
  // Ogni nome accumulato porta con sé la categoria attiva al momento in cui
  // è stato letto: un titolo di sezione può comparire PRIMA che arrivi il
  // blocco prezzi di più gruppi (es. due sottosezioni "PRIMI PIATTI" /
  // "SECONDI PIATTI" i cui prezzi arrivano tutti insieme, dopo entrambe) —
  // cambiare categoria non deve troncare i nomi già in sospeso.
  let chunkNames: string[] = [];
  let chunkCategories: string[] = [];
  let chunkPrices: number[] = [];
  // Nome "in sospeso" non ancora aggiunto a chunkNames: resta in attesa
  // finché non si sa se la riga successiva è una variante di formato (nel
  // qual caso genera più prodotti, uno per variante, es. "Coca Cola alla
  // spina" + "cl 0,30"/"cl 0,50"/"1 litro" = 3 prodotti) oppure no (nel
  // qual caso è semplicemente il nome di un solo prodotto).
  let pendingParent: string | null = null;
  let pendingParentUsed = false;

  const commitPendingParent = () => {
    if (pendingParent !== null && !pendingParentUsed) {
      chunkNames.push(pendingParent);
      chunkCategories.push(currentCategory);
    }
    pendingParent = null;
    pendingParentUsed = false;
  };

  const flushChunk = () => {
    const n = Math.min(chunkNames.length, chunkPrices.length);
    for (let i = 0; i < n; i++) {
      items.push({ categoria: chunkCategories[i], prodotto: chunkNames[i], prezzo: chunkPrices[i] });
    }
    chunkNames = [];
    chunkCategories = [];
    chunkPrices = [];
  };

  for (const line of rawLines) {
    const { collapsed, wasSpaced } = collapseLetterSpacing(line);
    if (wasSpaced || looksLikeCategory(line)) {
      commitPendingParent();
      currentCategory = collapsed;
      continue;
    }

    if (blocksMode) {
      const priceOnlyMatch = line.match(PRICE_ONLY_RE);
      const isVariablePrice = VARIABLE_PRICE_RE.test(line);
      if (priceOnlyMatch || isVariablePrice) {
        commitPendingParent();
        if (chunkNames.length > 0) {
          chunkPrices.push(priceOnlyMatch ? Number(priceOnlyMatch[1].replace(",", ".")) : 0);
        }
        continue;
      }

      const cleaned = stripAllergenSuffix(line);

      // "cl 0,30" dopo "Coca Cola alla spina": è una variante di formato,
      // genera un prodotto a sé ("Coca Cola alla spina cl 0,30") invece di
      // fondersi nel nome — il prezzo che arriverà è specifico di QUESTA
      // variante, non del nome genitore.
      if (pendingParent !== null && VARIANT_RE.test(cleaned)) {
        chunkNames.push(`${pendingParent} ${cleaned}`);
        chunkCategories.push(currentCategory);
        pendingParentUsed = true;
        continue;
      }

      // Un nome che va a capo continua quasi sempre in minuscolo (es. "...e
      // pomodorini" / "al profumo di basilico") — si accoda al nome in
      // sospeso invece di diventare un prodotto a parte. Un nome TUTTO
      // MAIUSCOLO che continua su un'altra riga resta tutto maiuscolo: qui
      // il segnale è che anche il nome in sospeso lo sia.
      if (
        pendingParent !== null &&
        !pendingParentUsed &&
        (/^\p{Ll}/u.test(cleaned) || (isAllCapsWord(cleaned) && isAllCapsWord(pendingParent)))
      ) {
        pendingParent += " " + cleaned;
        continue;
      }
      if (pendingParent === null) {
        const prevCommitted = chunkNames[chunkNames.length - 1];
        // Stesso controllo, ma solo se il nome precedente è della STESSA
        // categoria — un titolo di sezione in mezzo segnala sempre un
        // prodotto nuovo, anche se per coincidenza entrambi sono scritti
        // tutto maiuscolo.
        const samePrevCategory = chunkCategories[chunkCategories.length - 1] === currentCategory;
        if (
          prevCommitted !== undefined &&
          samePrevCategory &&
          (/^\p{Ll}/u.test(cleaned) || (isAllCapsWord(cleaned) && isAllCapsWord(prevCommitted)))
        ) {
          chunkNames[chunkNames.length - 1] += " " + cleaned;
          continue;
        }
      }

      // Nuovo gruppo nome/prezzo: il precedente in sospeso (se mai usato
      // come genitore di varianti) va confermato com'è; se il blocco prezzi
      // precedente è già iniziato, va anche chiuso il gruppo prima.
      commitPendingParent();
      if (chunkPrices.length > 0) flushChunk();
      pendingParent = cleaned;
      pendingParentUsed = false;
      continue;
    }

    // Formato "riga unica": prezzo in fondo alla stessa riga del nome.
    const inlineMatch = line.match(INLINE_PRICE_RE);
    if (inlineMatch && inlineMatch.index !== undefined) {
      const prezzo = Number(inlineMatch[1].replace(",", "."));
      const namePart = line.slice(0, inlineMatch.index).trim();
      const nameParts = namePart ? [...chunkNames, namePart] : chunkNames;
      chunkNames = [];
      const prodotto = nameParts.join(" - ").trim();
      if (prodotto && Number.isFinite(prezzo)) {
        items.push({ categoria: currentCategory, prodotto, prezzo });
      }
      continue;
    }
    chunkNames.push(line);
  }
  commitPendingParent();
  flushChunk();

  return items;
}

async function main() {
  const pdfPath = process.argv[2];
  if (!pdfPath) {
    console.log(JSON.stringify({ error: "missing pdf path" }));
    process.exit(1);
  }
  const { readFile } = await import("fs/promises");
  try {
    const buffer = await readFile(pdfPath);
    const result = await extractMenuFromPdf(buffer);
    process.stdout.write(JSON.stringify(result));
  } catch (err) {
    process.stdout.write(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }));
    process.exit(1);
  }
}

main();
