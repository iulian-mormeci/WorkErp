"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal, X } from "lucide-react";
import { NAV_ITEMS, MOBILE_PRIMARY_COUNT } from "@/lib/nav-items";
import { logout } from "@/app/logout-action";
import { useRealtimeCounts, type Counts } from "@/lib/realtime/use-realtime-counts";

function NavDot({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute right-1/2 top-0.5 flex h-4 min-w-4 -translate-y-1/2 translate-x-3 items-center justify-center rounded-full bg-pine-strong px-1 text-[0.625rem] font-medium text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function MobileNav({
  nome,
  isAdmin = false,
  counts,
}: {
  nome: string;
  isAdmin?: boolean;
  counts: Counts;
}) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const liveCounts = useRealtimeCounts(counts);

  const items = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);
  const primaryItems = items.slice(0, MOBILE_PRIMARY_COUNT);
  const restItems = items.slice(MOBILE_PRIMARY_COUNT);
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);
  const moreActive = restItems.some((item) => isActive(item.href));

  return (
    <>
      {moreOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            aria-label="Chiudi"
            onClick={() => setMoreOpen(false)}
            className="absolute inset-0 bg-ink/30"
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-xl border-t border-line bg-surface pb-[calc(env(safe-area-inset-bottom)+0.5rem)]">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <span className="text-sm font-medium text-ink">Altro</span>
              <button
                aria-label="Chiudi"
                onClick={() => setMoreOpen(false)}
                className="text-muted hover:text-ink"
              >
                <X className="size-5" />
              </button>
            </div>

            <nav className="p-2">
              {restItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm ${
                      active
                        ? "bg-pine/10 font-medium text-pine-strong"
                        : "text-ink hover:bg-paper"
                    }`}
                  >
                    <Icon className="size-4 shrink-0" strokeWidth={2} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-line px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="truncate text-sm text-ink">{nome}</span>
                <form action={logout}>
                  <button type="submit" className="text-sm text-muted hover:text-ink">
                    Esci
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden">
        {primaryItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          const count = item.countKey ? liveCounts[item.countKey] : 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[0.6875rem] ${
                active ? "text-pine-strong" : "text-muted"
              }`}
            >
              <span className="relative">
                <Icon className="size-5" strokeWidth={2} />
                <NavDot count={count} />
              </span>
              {item.label}
            </Link>
          );
        })}
        <button
          onClick={() => setMoreOpen(true)}
          aria-current={moreActive ? "page" : undefined}
          className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[0.6875rem] ${
            moreActive ? "text-pine-strong" : "text-muted"
          }`}
        >
          <MoreHorizontal className="size-5" strokeWidth={2} />
          Altro
        </button>
      </nav>
    </>
  );
}
