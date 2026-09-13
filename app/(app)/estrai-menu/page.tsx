import { MenuExtractBoard } from "./menu-extract-board";

export default function EstraiMenuPage() {
  return (
    <div className="flex flex-col gap-6 px-6 py-8 md:px-10 md:py-10">
      <header>
        <h1 className="text-xl font-semibold text-ink">Estrai menu</h1>
        <p className="mt-1 text-sm text-muted">
          Carica il PDF di un menu (anche una scansione o una foto) per ricavare l&apos;elenco dei
          prodotti con prezzo e categoria, da correggere e scaricare come CSV.
        </p>
      </header>

      <MenuExtractBoard />
    </div>
  );
}
