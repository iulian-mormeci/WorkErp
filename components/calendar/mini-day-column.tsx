"use client";

import Link from "next/link";
import { useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { occurrenceHref } from "./occurrence-chip";
import { packOverlaps, formatDateParam, isSameDay } from "@/lib/calendar/grid";
import { APP_TIME_ZONE, zonedMinutesSinceMidnight, zonedTimeToUtc, zonedYearMonthDay } from "@/lib/timezone";
import { Drawer } from "@/components/ui/drawer";
import type { Occurrence, OccurrenceColor } from "@/lib/calendar/occurrences";

const COLOR_CLASSES: Record<OccurrenceColor, string> = {
  pine: "border-pine/40 bg-pine/15 text-pine-strong",
  amber: "border-amber/40 bg-amber/15 text-amber",
  slate: "border-slate/40 bg-slate/15 text-slate",
};

const DOT_CLASSES: Record<OccurrenceColor, string> = {
  pine: "bg-pine-strong",
  amber: "bg-amber",
  slate: "bg-slate",
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
 * Vista settimana per il widget di dashboard: una griglia a 7 colonne su
 * schermi larghi (adattata alla finestra oraria condivisa min/max fra le
 * fasce di lavoro della settimana, mai scroll), sostituita sotto lo
 * breakpoint `sm` da un elenco verticale giorno per giorno — 7 colonne
 * strette non stanno in uno schermo di telefono, il testo risulterebbe
 * illeggibile o tagliato. In entrambe le viste, toccare/cliccare
 * un'occorrenza apre un pannello con tutti i dettagli invece di
 * navigare via subito: su mobile non c'è hover per l'anteprima rapida
 * (comunque presente sul desktop), quindi è l'unico modo di leggerli.
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
  const [selected, setSelected] = useState<Occurrence | null>(null);
  const windowMinutes = Math.max(1, windowEnd - windowStart);
  const today = new Date();
  const nowMinutes = zonedMinutesSinceMidnight(new Date(), APP_TIME_ZONE);

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

      {/* Elenco verticale: sotto sm, al posto della griglia a 7 colonne. */}
      <div className="min-h-0 flex-1 overflow-y-auto sm:hidden">
        <div className="flex flex-col divide-y divide-line">
          {days.map((day) => {
            const isToday = isSameDay(day.date, today);
            const sorted = [...day.occurrences].sort((a, b) => {
              if (a.allDay !== b.allDay) return a.allDay ? -1 : 1;
              return a.start.getTime() - b.start.getTime();
            });
            return (
              <div key={formatDateParam(day.date)} className="py-2">
                <p
                  className={`px-1 text-xs font-medium ${isToday ? "text-pine-strong" : "text-muted"}`}
                >
                  {WEEKDAY_LABELS[(day.date.getDay() + 6) % 7]}{" "}
                  {day.date.toLocaleDateString("it-IT", { day: "numeric", month: "short" })}
                </p>
                {sorted.length === 0 ? (
                  <p className="px-1 py-1.5 text-sm text-muted">Nessun impegno</p>
                ) : (
                  <div className="mt-1 flex flex-col">
                    {sorted.map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => setSelected(o)}
                        className="flex items-center gap-2 rounded px-1 py-1.5 text-left hover:bg-paper"
                      >
                        <span className={`size-2 shrink-0 rounded-full ${DOT_CLASSES[o.colorToken]}`} />
                        <span className="min-w-0 flex-1 truncate text-sm text-ink">{o.titolo}</span>
                        <span className="shrink-0 text-xs text-muted">
                          {o.allDay ? "Tutto il giorno" : formatTimeRange(o)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Griglia a 7 colonne: da sm in su. */}
      <div className="hidden min-h-0 flex-1 gap-1 sm:flex">
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
                    <button
                      key={o.id}
                      type="button"
                      onMouseEnter={(e) => handleEnter(o, e.currentTarget)}
                      onMouseLeave={() => setHover(null)}
                      onClick={() => setSelected(o)}
                      className={`absolute overflow-hidden rounded border px-1 text-left text-xs leading-tight hover:opacity-80 hover:z-20 ${COLOR_CLASSES[o.colorToken]}`}
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
                    </button>
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

      <Drawer
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected ? SOURCE_LABEL[selected.source] : ""}
      >
        {selected && (
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-base font-medium text-ink">{selected.titolo}</p>
              <p className="mt-1 text-sm text-muted">
                {selected.allDay ? "Tutto il giorno" : formatTimeRange(selected)}
                {" · "}
                {selected.start.toLocaleDateString("it-IT", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </p>
            </div>
            {selected.detail.subtitle && <p className="text-sm text-ink">{selected.detail.subtitle}</p>}
            {selected.detail.stato && (
              <p className="text-sm text-muted">Stato: {selected.detail.stato}</p>
            )}
            {selected.detail.description && (
              <p className="whitespace-pre-wrap text-sm text-muted">{selected.detail.description}</p>
            )}
            <Link
              href={occurrenceHref(
                selected,
                (eventoId) =>
                  `/calendario?vista=giorno&data=${formatDateParam(selected.start)}&evento=${eventoId}`
              )}
              onClick={() => setSelected(null)}
              className="mt-1 self-start rounded-md bg-pine-strong px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
            >
              Apri
            </Link>
          </div>
        )}
      </Drawer>
    </div>
  );
}

function formatTimeRange(o: Occurrence) {
  const fmt = (d: Date) => {
    const minutes = zonedMinutesSinceMidnight(d, APP_TIME_ZONE);
    return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
  };
  return `${fmt(o.start)}–${fmt(o.end)}`;
}

function pct(value: number, total: number) {
  return `${Math.max(0, Math.min(100, (value / total) * 100))}%`;
}

function minutesSince(date: Date, windowStartMinutes: number) {
  return zonedMinutesSinceMidnight(date, APP_TIME_ZONE) - windowStartMinutes;
}

function clampToWindow(date: Date, windowStartMinutes: number, isEnd = false): Date {
  const minutes = zonedMinutesSinceMidnight(date, APP_TIME_ZONE);
  if (!isEnd && minutes < windowStartMinutes) {
    const { year, month, day } = zonedYearMonthDay(date, APP_TIME_ZONE);
    return zonedTimeToUtc(
      year,
      month,
      day,
      Math.floor(windowStartMinutes / 60),
      windowStartMinutes % 60,
      APP_TIME_ZONE
    );
  }
  return date;
}
