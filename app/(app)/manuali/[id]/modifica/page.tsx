import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { updateManual } from "../../actions";
import { ManualForm } from "../../manual-form";

export default async function ModificaManualePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;

  const manual = await prisma.manual.findUnique({ where: { id } });
  if (!manual) notFound();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-8 md:px-10 md:py-10">
      <Link
        href={`/manuali/${manual.id}`}
        className="flex items-center gap-1.5 text-sm text-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" />
        {manual.titolo}
      </Link>

      <header>
        <h1 className="text-xl font-semibold text-ink">Modifica manuale</h1>
      </header>

      <ManualForm
        action={updateManual.bind(null, manual.id)}
        submitLabel="Salva modifiche"
        manual={manual}
      />
    </div>
  );
}
