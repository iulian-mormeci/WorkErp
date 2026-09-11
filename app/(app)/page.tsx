import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import type { WidgetType } from "@/lib/generated/prisma/enums";
import { parseDateParam } from "@/lib/calendar/grid";
import type { WidgetLayoutInput } from "./dashboard-actions";
import { DashboardGrid } from "@/components/dashboard/dashboard-grid";
import { MiniCalendarWidget } from "@/components/dashboard/mini-calendar-widget";
import { ProssimeAttivitaWidget } from "@/components/dashboard/prossime-attivita-widget";
import { ProssimiLavoriWidget } from "@/components/dashboard/prossimi-lavori-widget";
import { NoteRapideWidget } from "@/components/dashboard/note-rapide-widget";
import { ManualiRapidiWidget } from "@/components/dashboard/manuali-rapidi-widget";

const DEFAULT_LAYOUT: Record<WidgetType, Omit<WidgetLayoutInput, "tipoWidget">> = {
  MINI_CALENDARIO: { x: 0, y: 0, w: 6, h: 9 },
  PROSSIME_ATTIVITA: { x: 6, y: 0, w: 6, h: 4 },
  PROSSIMI_LAVORI: { x: 6, y: 4, w: 6, h: 4 },
  NOTE_RAPIDE: { x: 0, y: 9, w: 6, h: 4 },
  MANUALI_RAPIDI: { x: 6, y: 8, w: 6, h: 5 },
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ settimana?: string }>;
}) {
  const user = await requireUser();
  const { settimana } = await searchParams;
  const baseDate = parseDateParam(settimana);

  const savedLayout = await prisma.dashboardWidgetLayout.findMany({ where: { userId: user.id } });
  const savedByType = new Map(savedLayout.map((item) => [item.tipoWidget, item]));

  const layout: WidgetLayoutInput[] = (Object.keys(DEFAULT_LAYOUT) as WidgetType[]).map((tipoWidget) => {
    const saved = savedByType.get(tipoWidget);
    return saved
      ? { tipoWidget, x: saved.x, y: saved.y, w: saved.w, h: saved.h }
      : { tipoWidget, ...DEFAULT_LAYOUT[tipoWidget] };
  });

  const widgets = [
    {
      tipoWidget: "MINI_CALENDARIO" as const,
      node: <MiniCalendarWidget userId={user.id} baseDate={baseDate} />,
    },
    { tipoWidget: "PROSSIME_ATTIVITA" as const, node: <ProssimeAttivitaWidget userId={user.id} /> },
    { tipoWidget: "PROSSIMI_LAVORI" as const, node: <ProssimiLavoriWidget userId={user.id} /> },
    { tipoWidget: "NOTE_RAPIDE" as const, node: <NoteRapideWidget userId={user.id} /> },
    { tipoWidget: "MANUALI_RAPIDI" as const, node: <ManualiRapidiWidget userId={user.id} /> },
  ];

  return (
    <div className="flex flex-col gap-4 px-4 py-8 md:px-6 md:py-10">
      <header>
        <h1 className="text-xl font-semibold text-ink">Dashboard</h1>
        <p className="mt-1 text-sm text-muted">
          Trascina l&apos;intestazione di un widget per spostarlo, trascina l&apos;angolo per
          ridimensionarlo.
        </p>
      </header>

      <DashboardGrid initialLayout={layout} widgets={widgets} />
    </div>
  );
}
