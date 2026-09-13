"use client";

import "react-grid-layout/css/styles.css";
import { useCallback, useRef, useState, type ReactNode } from "react";
import { GridLayout, useContainerWidth, type Layout } from "react-grid-layout";
import type { WidgetType } from "@/lib/generated/prisma/enums";
import { saveDashboardLayout, type WidgetLayoutInput } from "@/app/(app)/dashboard-actions";

const ROW_HEIGHT_PX = 32;
const SAVE_DEBOUNCE_MS = 500;

export function DashboardGrid({
  initialLayout,
  widgets,
}: {
  initialLayout: WidgetLayoutInput[];
  widgets: { tipoWidget: WidgetType; node: ReactNode }[];
}) {
  const { width, containerRef, mounted } = useContainerWidth();
  const [layout, setLayout] = useState<Layout>(() =>
    initialLayout.map((item) => ({ i: item.tipoWidget, x: item.x, y: item.y, w: item.w, h: item.h }))
  );
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLayoutChange = useCallback((newLayout: Layout) => {
    setLayout(newLayout);
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      void saveDashboardLayout(
        newLayout.map((item) => ({
          tipoWidget: item.i as WidgetType,
          x: item.x,
          y: item.y,
          w: item.w,
          h: item.h,
        }))
      );
    }, SAVE_DEBOUNCE_MS);
  }, []);

  // Sotto sm: la griglia trascinabile/ridimensionabile a 12 colonne non ha
  // senso su un telefono (le colonne diventerebbero troppo strette per
  // qualunque contenuto, vedi il mini-calendario) — si passa a un elenco
  // verticale a piena larghezza, un widget sotto l'altro. L'altezza di ogni
  // widget resta quella salvata (in "unità riga", come nella griglia
  // desktop): WidgetShell e i suoi contenuti assumono un'altezza definita
  // dal genitore per gestire da soli lo scroll interno.
  return (
    <>
      <div className="flex flex-col gap-3 sm:hidden">
        {widgets.map((widget) => {
          const h = layout.find((item) => item.i === widget.tipoWidget)?.h ?? 8;
          return (
            <div key={widget.tipoWidget} style={{ height: h * ROW_HEIGHT_PX + (h - 1) * 12 }}>
              {widget.node}
            </div>
          );
        })}
      </div>
      <div ref={containerRef} className="hidden sm:block">
        {mounted && (
          <GridLayout
            width={width}
            layout={layout}
            gridConfig={{ cols: 12, rowHeight: ROW_HEIGHT_PX, margin: [12, 12] }}
            dragConfig={{ handle: ".widget-drag-handle" }}
            onLayoutChange={handleLayoutChange}
          >
            {widgets.map((widget) => (
              <div key={widget.tipoWidget}>{widget.node}</div>
            ))}
          </GridLayout>
        )}
      </div>
    </>
  );
}
