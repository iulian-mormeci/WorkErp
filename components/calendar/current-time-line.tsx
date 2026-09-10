"use client";

import { useEffect, useState } from "react";
import { HOUR_ROW_HEIGHT_PX, minutesSinceMidnight } from "@/lib/calendar/grid";

export function CurrentTimeLine() {
  const [minutes, setMinutes] = useState<number | null>(null);

  useEffect(() => {
    const update = () => setMinutes(minutesSinceMidnight(new Date()));
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, []);

  // Evita un mismatch idratazione/SSR: niente riga finché il client non ha calcolato l'orario reale.
  if (minutes === null) return null;

  const top = (minutes / 60) * HOUR_ROW_HEIGHT_PX;

  return (
    <div className="pointer-events-none absolute inset-x-0 z-20" style={{ top }}>
      <div className="relative">
        <span className="absolute -left-1 -top-1 size-2 rounded-full bg-danger" />
        <div className="border-t border-danger" />
      </div>
    </div>
  );
}
