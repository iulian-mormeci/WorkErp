"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/nav-items";
import { logout } from "@/app/logout-action";

export function Sidebar({ nome, isAdmin = false }: { nome: string; isAdmin?: boolean }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  return (
    <aside className="hidden md:flex md:w-[var(--shell-width-sidebar)] md:shrink-0 md:flex-col md:border-r md:border-line md:bg-surface">
      <div className="flex h-[var(--shell-height-topbar)] items-center px-5">
        <span className="text-[0.9375rem] font-semibold tracking-tight text-ink">
          Workerp
        </span>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-2">
        {items.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`relative flex items-center gap-3 rounded-md py-2 pl-3 pr-3 text-sm transition-colors ${
                active
                  ? "bg-pine/10 font-medium text-pine-strong"
                  : "text-muted hover:bg-paper hover:text-ink"
              }`}
            >
              {active && (
                <span className="absolute inset-y-1 left-0 w-0.5 rounded-full bg-pine" />
              )}
              <Icon className="size-4 shrink-0" strokeWidth={2} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-line px-3 py-3">
        <div className="flex items-center justify-between gap-2 px-3">
          <span className="truncate text-sm text-ink">{nome}</span>
          <form action={logout}>
            <button
              type="submit"
              className="shrink-0 text-sm text-muted hover:text-ink"
            >
              Esci
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
