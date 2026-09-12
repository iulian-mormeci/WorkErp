import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { createManual } from "../actions";
import { ManualForm } from "../manual-form";

export default async function NuovoManualePage() {
  await requireUser();

  return (
    <div className="flex flex-col gap-6 px-6 py-8 md:px-10 md:py-10">
      <Link
        href="/manuali"
        className="flex items-center gap-1.5 text-sm text-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" />
        Manuali e guide
      </Link>

      <header>
        <h1 className="text-xl font-semibold text-ink">Nuovo manuale</h1>
      </header>

      <ManualForm action={createManual} submitLabel="Crea manuale" />
    </div>
  );
}
