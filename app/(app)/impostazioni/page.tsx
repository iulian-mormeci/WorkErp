import { requireUser } from "@/lib/auth/session";
import { UnoErpCard } from "./unoerp-card";

export default async function ImpostazioniPage() {
  await requireUser();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-8 md:px-10 md:py-10">
      <header>
        <h1 className="text-xl font-semibold text-ink">Impostazioni</h1>
        <p className="mt-1 text-sm text-muted">Preferenze generali e integrazioni.</p>
      </header>

      <UnoErpCard />
    </div>
  );
}
