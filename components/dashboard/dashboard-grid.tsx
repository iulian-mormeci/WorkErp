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

  return (
    <div ref={containerRef}>
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
  );
}
