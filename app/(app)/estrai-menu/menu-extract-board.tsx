"use client";

import { useActionState, useState } from "react";
import { Download, Plus, Trash2, TriangleAlert } from "lucide-react";
import { extractMenuPdf, type MenuExtractState } from "./actions";
import type { MenuItem } from "@/lib/menu-pdf";

type Row = MenuItem & { key: string };

function toRows(items: MenuItem[]): Row[] {
  return items.map((item, i) => ({ ...item, key: `${i}-${crypto.randomUUID()}` }));
}

function downloadCsv(rows: Row[]) {
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const header = ["Categoria", "Prodotto", "Prezzo"].join(";");
  const lines = rows.map((r) =>
    [escape(r.categoria), escape(r.prodotto), r.prezzo.toFixed(2).replace(".", ",")].join(";")
  );
  const csv = "﻿" + [header, ...lines].join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "menu.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function MenuExtractBoard() {
  const [state, formAction, pending] = useActionState<MenuExtractState, FormData>(
    extractMenuPdf,
    undefined
  );
  const [rows, setRows] = useState<Row[] | null>(null);

  // Ogni nuova estrazione riuscita sostituisce la tabella modificabile.
  // Confronto diretto durante il render (invece di un useEffect) per
  // evitare un giro di render in più solo per sincronizzare questo stato.
  const [handledState, setHandledState] = useState<MenuExtractState>(undefined);
  if (state !== handledState) {
    setHandledState(state);
    if (state && "items" in state) setRows(toRows(state.items));
  }

  const updateRow = (key: string, patch: Partial<MenuItem>) => {
    setRows((prev) => prev?.map((r) => (r.key === key ? { ...r, ...patch } : r)) ?? prev);
  };

  const removeRow = (key: string) => {
    setRows((prev) => prev?.filter((r) => r.key !== key) ?? prev);
  };

  const addRow = () => {
    setRows((prev) => [...(prev ?? []), { key: crypto.randomUUID(), categoria: "", prodotto: "", prezzo: 0 }]);
  };

  return (
    <div className="flex flex-col gap-6">
      <form action={formAction} className="flex flex-col gap-3 rounded-md border border-line bg-surface p-4">
        <div className="space-y-1">
          <label className="text-sm text-muted">PDF del menu</label>
          <input
            type="file"
            name="file"
            accept="application/pdf"
            required
            className="block w-full text-sm text-muted file:mr-3 file:rounded-md file:border-0 file:bg-paper file:px-3 file:py-2 file:text-sm file:text-ink hover:file:bg-line"
          />
          <p className="text-xs text-muted">Massimo 20MB, anche una scansione o una foto.</p>
        </div>

        {state && "error" in state && <p className="text-sm text-danger">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="self-start rounded-md bg-pine-strong px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Lettura in corso… può richiedere qualche secondo" : "Estrai prodotti"}
        </button>
      </form>

      {state && "warnings" in state && state.warnings.length > 0 && (
        <div className="flex flex-col gap-1 rounded-md border border-amber/40 bg-amber/10 p-3 text-sm text-amber">
          {state.warnings.map((w, i) => (
            <p key={i} className="flex items-start gap-2">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" />
              {w}
            </p>
          ))}
        </div>
      )}

      {rows && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted">
              {rows.length} prodott{rows.length === 1 ? "o" : "i"} riconosciut
              {rows.length === 1 ? "o" : "i"} — controlla e correggi prima di scaricare, l&apos;estrazione
              automatica può contenere errori.
            </p>
            <button
              type="button"
              onClick={() => downloadCsv(rows)}
              disabled={rows.length === 0}
              className="flex shrink-0 items-center gap-1.5 rounded-md bg-pine-strong px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              <Download className="size-4" />
              Scarica CSV
            </button>
          </div>

          <div className="overflow-x-auto rounded-md border border-line">
            <table className="w-full min-w-[36rem] text-sm">
              <thead>
                <tr className="border-b border-line bg-surface text-left text-xs text-muted">
                  <th className="px-3 py-2 font-medium">Categoria</th>
                  <th className="px-3 py-2 font-medium">Prodotto</th>
                  <th className="w-28 px-3 py-2 font-medium">Prezzo</th>
                  <th className="w-10 px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.key} className="border-b border-line last:border-b-0">
                    <td className="p-1.5">
                      <input
                        value={row.categoria}
                        onChange={(e) => updateRow(row.key, { categoria: e.target.value })}
                        className="w-full rounded border border-transparent bg-transparent px-2 py-1 text-ink outline-none hover:border-line focus:border-pine"
                      />
                    </td>
                    <td className="p-1.5">
                      <input
                        value={row.prodotto}
                        onChange={(e) => updateRow(row.key, { prodotto: e.target.value })}
                        className="w-full rounded border border-transparent bg-transparent px-2 py-1 text-ink outline-none hover:border-line focus:border-pine"
                      />
                    </td>
                    <td className="p-1.5">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={row.prezzo}
                        onChange={(e) => updateRow(row.key, { prezzo: Number(e.target.value) })}
                        className="w-full rounded border border-transparent bg-transparent px-2 py-1 text-ink outline-none hover:border-line focus:border-pine"
                      />
                    </td>
                    <td className="p-1.5 text-center">
                      <button
                        type="button"
                        aria-label="Rimuovi riga"
                        onClick={() => removeRow(row.key)}
                        className="rounded p-1 text-muted hover:text-danger"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={addRow}
            className="flex items-center gap-1.5 self-start text-sm text-pine-strong hover:opacity-80"
          >
            <Plus className="size-4" />
            Aggiungi riga
          </button>
        </div>
      )}
    </div>
  );
}
