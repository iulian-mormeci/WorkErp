"use client";

import Link from "next/link";
import { useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { occurrenceHref } from "./occurrence-chip";
import { packOverlaps, formatDateParam, isSameDay } from "@/lib/calendar/grid";
import type { Occurrence, OccurrenceColor } from "@/lib/calendar/occurrences";

const COLOR_CLASSES: Record<OccurrenceColor, string> = {
  pine: "border-pine/40 bg-pine/15 text-pine-strong",
  amber: "border-amber/40 bg-amber/15 text-amber",
  slate: "border-slate/40 bg-slate/15 text-slate",
};

const SOURCE_LABEL: Record<Occurrence["source"], string> = {
  event: "Evento",
  task: "Attività",
  job: "Lavoro",
};

const WEEKDAY_LABELS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
const TOOLTIP_WIDTH = 260;

export type MiniWeekDay = {
  date: Date;
  occurrences: Occurrence[];
  workingRanges: { start: number; end: number }[];
};

type HoverState = { occurrence: Occurrence; top: number; left: number; openUpward: boolean };

/**
 * Vista settimana compatta per il widget di dashboard: 7 colonne giorno
 * affiancate più una colonnina oraria a sinistra, nessun px fisso — tutto in
 * percentuale rispetto a un'unica finestra oraria condivisa (min inizio –
 * max fine fra le fasce di lavoro dell'intera settimana) — si adatta sempre
 * all'altezza che la griglia del dashboard gli assegna, mai scroll. Al
 * passaggio del mouse su un'occorrenza mostra un popup con i dettagli, reso
 * via portal in `document.body`: i widget vivono dentro un `.react-grid-item`
 * con `transform` inline (react-grid-layout), e un ancestor con `transform`
 * diventa il containing block di `position: fixed` — senza portal il popup
 * finirebbe ancorato a quel riquadro invece che alla viewport.
 */
export function MiniWeekGrid({
  days,
  windowStart,
  windowEnd,
  prevHref,
  nextHref,
  todayHref,
  rangeLabel,
}: {
  days: MiniWeekDay[];
  windowStart: number;
  windowEnd: number;
  prevHref: string;
  nextHref: string;
  todayHref?: string;
  rangeLabel: string;
}) {
  const [hover, setHover] = useState<HoverState | null>(null);
  const windowMinutes = Math.max(1, windowEnd - windowStart);
  const today = new Date();
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const hourStep = windowMinutes > 8 * 60 ? 2 : 1;
  const firstHour = Math.ceil(windowStart / 60);
  const lastHour = Math.floor(windowEnd / 60);
  const hourMarks: number[] = [];
  for (let h = firstHour; h <= lastHour; h += hourStep) hourMarks.push(h);

  const handleEnter = (occurrence: Occurrence, target: HTMLElement) => {
    const rect = target.getBoundingClientRect();
    const openUpward = rect.top > window.innerHeight / 2;
    setHover({
      occurrence,
      left: Math.min(Math.max(8, rect.left), window.innerWidth - TOOLTIP_WIDTH - 8),
      top: openUpward ? rect.top - 6 : rect.bottom + 6,
      openUpward,
    });
  };

  return (
    <div className="flex h-full min-h-[8rem] flex-col gap-1">
      <div className="flex shrink-0 items-center justify-between gap-2 px-0.5">
        <Link
          href={prevHref}
          aria-label="Settimana precedente"
          className="rounded p-0.5 text-muted hover:bg-paper hover:text-ink"
        >
          <ChevronLeft className="size-4" />
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-ink">{rangeLabel}</span>
          {todayHref && (
            <Link
              href={todayHref}
              className="rounded border border-line px-1.5 py-0.5 text-xs text-ink hover:bg-paper"
            >
              Oggi
            </Link>
          )}
        </div>
        <Link
          href={nextHref}
          aria-label="Settimana successiva"
          className="rounded p-0.5 text-muted hover:bg-paper hover:text-ink"
        >
          <ChevronRight className="size-4" />
        </Link>
      </div>

      <div className="flex min-h-0 flex-1 gap-1">
        <div className="relative w-11 shrink-0">
          <div className="mb-0.5 h-[1.35rem] shrink-0" />
          <div className="relative h-[calc(100%-1.35rem)]">
            {hourMarks.map((h) => (
              <span
                key={h}
                className="absolute right-1 text-xs text-muted"
                style={{
                  top: pct(h * 60 - windowStart, windowMinutes),
                  // L'etichetta è centrata sulla riga oraria, ma a inizio e
                  // fine finestra centrarla la farebbe uscire dal contenitore
                  // (che non scrolla): le due etichette estreme si ancorano
                  // invece al proprio bordo, verso l'interno.
                  transform: h === firstHour ? "translateY(0%)" : h === lastHour ? "translateY(-100%)" : "translateY(-50%)",
                }}
              >
                {h}:00
              </span>
            ))}
          </div>
        </div>

        {days.map((day) => {
          const isToday = isSameDay(day.date, today);
          const dateStr = formatDateParam(day.date);
          const timed = packOverlaps(
            day.occurrences
              .filter((o) => !o.allDay)
              .map((o) => ({
                ...o,
                // Clampa dentro la finestra: un blocco che sconfina (es.
                // inizia prima dell'orario di lavoro) resta comunque
                // visibile e cliccabile.
                start: clampToWindow(o.start, windowStart),
                end: clampToWindow(o.end, windowStart, true),
              }))
          );

          return (
            <div key={dateStr} className="flex min-w-0 flex-1 flex-col">
              <div
                className={`mb-0.5 shrink-0 truncate text-center text-xs font-medium ${
                  isToday ? "text-pine-strong" : "text-muted"
                }`}
              >
                {WEEKDAY_LABELS[(day.date.getDay() + 6) % 7]} {day.date.getDate()}
              </div>
              <div
                className={`relative min-h-0 flex-1 overflow-hidden rounded-md border bg-paper ${
                  isToday ? "border-pine/40" : "border-line"
                }`}
              >
                {hourMarks.map((h) => (
                  <div
                    key={h}
                    className="absolute inset-x-0 border-t border-line/50"
                    style={{ top: pct(h * 60 - windowStart, windowMinutes) }}
                  />
                ))}

                {day.workingRanges.map((range, i) => (
                  <div
                    key={i}
                    className="absolute inset-x-0 bg-pine/5"
                    style={{
                      top: pct(range.start - windowStart, windowMinutes),
                      height: pct(range.end - range.start, windowMinutes),
                    }}
                  />
                ))}

                {isToday && nowMinutes >= windowStart && nowMinutes <= windowEnd && (
                  <div
                    className="absolute inset-x-0 z-10 border-t border-danger"
                    style={{ top: pct(nowMinutes - windowStart, windowMinutes) }}
                  >
                    <span className="absolute -left-0.5 -top-0.5 size-1.5 rounded-full bg-danger" />
                  </div>
                )}

                {timed.map((o) => {
                  const startOffset = minutesSince(o.start, windowStart);
                  const duration = Math.max(1, (o.end.getTime() - o.start.getTime()) / 60_000);
                  const widthPct = 100 / o.columns;
                  return (
                    <Link
                      key={o.id}
                      href={occurrenceHref(
                        o,
                        (eventoId) => `/calendario?vista=giorno&data=${dateStr}&evento=${eventoId}`
                      )}
                      onMouseEnter={(e) => handleEnter(o, e.currentTarget)}
                      onMouseLeave={() => setHover(null)}
                      className={`absolute overflow-hidden rounded border px-1 text-xs leading-tight hover:opacity-80 hover:z-20 ${COLOR_CLASSES[o.colorToken]}`}
                      style={{
                        top: pct(startOffset, windowMinutes),
                        height: pct(duration, windowMinutes),
                        // Un impegno breve (es. 15-30 min) su una finestra di
                        // molte ore avrebbe un blocco alto pochi px, troppo
                        // poco per il testo: si garantisce sempre almeno
                        // un'altezza leggibile, anche a costo di sconfinare
                        // leggermente su un impegno successivo libero sotto.
                        minHeight: "1.1rem",
                        left: `${o.column * widthPct}%`,
                        width: `${widthPct}%`,
                      }}
                    >
                      {o.titolo}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {hover &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="pointer-events-none fixed z-50 rounded-md border border-line bg-surface p-3 text-sm shadow-lg"
            style={{
              left: hover.left,
              width: TOOLTIP_WIDTH,
              top: hover.openUpward ? undefined : hover.top,
              bottom: hover.openUpward ? window.innerHeight - hover.top : undefined,
            }}
          >
            <p className="font-medium text-ink">{hover.occurrence.titolo}</p>
            <p className="mt-0.5 text-xs text-muted">
              {SOURCE_LABEL[hover.occurrence.source]} · {formatTimeRange(hover.occurrence)}
            </p>
            {hover.occurrence.detail.subtitle && (
              <p className="mt-1.5 text-ink">{hover.occurrence.detail.subtitle}</p>
            )}
            {hover.occurrence.detail.stato && (
              <p className="mt-1.5 text-xs text-muted">Stato: {hover.occurrence.detail.stato}</p>
            )}
            {hover.occurrence.detail.description && (
              <p className="mt-1.5 whitespace-pre-wrap text-xs text-muted">
                {hover.occurrence.detail.description}
              </p>
            )}
          </div>,
          document.body
        )}
    </div>
  );
}

function formatTimeRange(o: Occurrence) {
  const fmt = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return `${fmt(o.start)}–${fmt(o.end)}`;
}

function pct(value: number, total: number) {
  return `${Math.max(0, Math.min(100, (value / total) * 100))}%`;
}

function minutesSince(date: Date, windowStartMinutes: number) {
  return date.getHours() * 60 + date.getMinutes() - windowStartMinutes;
}

function clampToWindow(date: Date, windowStartMinutes: number, isEnd = false): Date {
  const minutes = date.getHours() * 60 + date.getMinutes();
  if (!isEnd && minutes < windowStartMinutes) {
    const d = new Date(date);
    d.setHours(Math.floor(windowStartMinutes / 60), windowStartMinutes % 60, 0, 0);
    return d;
  }
  return date;
}
