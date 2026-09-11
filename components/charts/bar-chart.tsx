// Bar chart minimale, costruito con semplici div (nessuna libreria di
// grafici): coerente con l'approccio già usato nel mini-calendario della
// dashboard, e sufficiente per gli aggregati mostrati in questa app.
export function BarChart({
  data,
  orientation = "vertical",
  height = 180,
  formatValue = (value) => String(value),
}: {
  data: { label: string; value: number }[];
  orientation?: "vertical" | "horizontal";
  height?: number;
  formatValue?: (value: number) => string;
}) {
  if (data.length === 0) {
    return <p className="text-sm text-muted">Nessun dato da mostrare.</p>;
  }

  const max = Math.max(1, ...data.map((d) => d.value));

  if (orientation === "horizontal") {
    return (
      <div className="space-y-2.5">
        {data.map((d) => (
          <div key={d.label} className="flex items-center gap-2">
            <span className="w-28 shrink-0 truncate text-xs text-muted" title={d.label}>
              {d.label}
            </span>
            <div className="h-4 flex-1 overflow-hidden rounded bg-paper">
              <div
                className="h-full rounded bg-pine-strong"
                style={{ width: `${Math.max(2, (d.value / max) * 100)}%` }}
              />
            </div>
            <span className="w-24 shrink-0 text-right text-xs text-ink">{formatValue(d.value)}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-end gap-3" style={{ height }}>
      {data.map((d) => (
        <div key={d.label} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
          <span className="text-[0.65rem] text-muted">{formatValue(d.value)}</span>
          <div
            className="w-full rounded-t bg-pine-strong"
            style={{ height: `${Math.max(2, (d.value / max) * (height - 40))}px` }}
          />
          <span className="truncate text-xs text-muted">{d.label}</span>
        </div>
      ))}
    </div>
  );
}
