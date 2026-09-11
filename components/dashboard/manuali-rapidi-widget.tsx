import Link from "next/link";
import { BookOpen } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { WidgetShell } from "./widget-shell";

export async function ManualiRapidiWidget({ userId }: { userId: string }) {
  const manuali = await prisma.manual.findMany({
    where: { OR: [{ ownerId: userId }, { library: { some: { userId } } }] },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return (
    <WidgetShell title="Manuali e guide" icon={BookOpen} href="/manuali">
      {manuali.length === 0 ? (
        <p className="text-sm text-muted">Nessun manuale ancora.</p>
      ) : (
        <ul className="space-y-1.5">
          {manuali.map((manual) => (
            <li key={manual.id}>
              <Link
                href={`/manuali/${manual.id}`}
                className="block truncate text-sm text-ink hover:text-pine-strong"
              >
                {manual.titolo}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </WidgetShell>
  );
}
