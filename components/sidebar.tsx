"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { NAV_ITEMS } from "@/lib/nav-items";
import { logout } from "@/app/logout-action";
import { useRealtimeCounts, type Counts } from "@/lib/realtime/use-realtime-counts";

const COLLAPSE_STORAGE_KEY = "workerp:sidebar-collapsed";
const COLLAPSE_CHANGE_EVENT = "workerp:sidebar-collapsed-change";

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSE_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function subscribeCollapsed(callback: () => void) {
  window.addEventListener(COLLAPSE_CHANGE_EVENT, callback);
  return () => window.removeEventListener(COLLAPSE_CHANGE_EVENT, callback);
}

function getServerCollapsed() {
  return false;
}

function writeCollapsed(next: boolean) {
  try {
    localStorage.setItem(COLLAPSE_STORAGE_KEY, next ? "1" : "0");
  } catch {
    // niente persistenza disponibile: il toggle funziona comunque per la sessione corrente.
  }
  window.dispatchEvent(new Event(COLLAPSE_CHANGE_EVENT));
}

function NavBadge({ count, collapsed }: { count: number; collapsed: boolean }) {
  if (count <= 0) return null;
  const label = count > 99 ? "99+" : String(count);
  if (collapsed) {
    return (
      <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-pine-strong px-1 text-[0.625rem] font-medium text-white">
        {label}
      </span>
    );
  }
  return (
    <span className="ml-auto flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-pine-strong px-1.5 text-[0.6875rem] font-medium text-white">
      {label}
    </span>
  );
}

export function Sidebar({
  nome,
  isAdmin = false,
  counts,
}: {
  nome: string;
  isAdmin?: boolean;
  counts: Counts;
}) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);
  const liveCounts = useRealtimeCounts(counts);

  // `useSyncExternalStore` invece di stato+effetto: la preferenza vive in
  // localStorage (una fonte esterna a React), non in memoria del
  // componente. Lo snapshot server è sempre "espansa" per evitare mismatch
  // di idratazione; dopo il mount il componente si risincronizza da solo.
  const collapsed = useSyncExternalStore(subscribeCollapsed, readCollapsed, getServerCollapsed);

  function toggleCollapsed() {
    writeCollapsed(!collapsed);
  }

  return (
    <aside
      className={`hidden md:sticky md:top-0 md:flex md:h-screen md:shrink-0 md:flex-col md:overflow-y-auto md:border-r md:border-line md:bg-surface ${
        collapsed ? "md:w-16" : "md:w-[var(--shell-width-sidebar)]"
      }`}
    >
      <div className="flex h-[var(--shell-height-topbar)] items-center px-5">
        {!collapsed && (
          <span className="truncate text-[0.9375rem] font-semibold tracking-tight text-ink">
            Workerp
          </span>
        )}
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-2">
        {items.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          const count = item.countKey ? liveCounts[item.countKey] : 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              aria-current={active ? "page" : undefined}
              className={`relative flex items-center gap-3 rounded-md py-2 text-sm transition-colors ${
                collapsed ? "justify-center px-2" : "pl-3 pr-3"
              } ${
                active
                  ? "bg-pine/10 font-medium text-pine-strong"
                  : "text-muted hover:bg-paper hover:text-ink"
              }`}
            >
              {active && (
                <span className="absolute inset-y-1 left-0 w-0.5 rounded-full bg-pine" />
              )}
              <span className="relative shrink-0">
                <Icon className="size-4" strokeWidth={2} />
                {collapsed && <NavBadge count={count} collapsed />}
              </span>
              {!collapsed && (
                <>
                  {item.label}
                  <NavBadge count={count} collapsed={false} />
                </>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-line px-3 py-2">
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Espandi la sidebar" : "Comprimi la sidebar"}
          className={`flex w-full items-center gap-3 rounded-md py-2 text-sm text-muted hover:bg-paper hover:text-ink ${
            collapsed ? "justify-center px-2" : "pl-3 pr-3"
          }`}
        >
          {collapsed ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
          {!collapsed && "Comprimi"}
        </button>
      </div>

      <div className="border-t border-line px-3 py-3">
        {collapsed ? (
          <form action={logout} className="flex justify-center">
            <button type="submit" title="Esci" className="text-sm text-muted hover:text-ink">
              Esci
            </button>
          </form>
        ) : (
          <div className="flex items-center justify-between gap-2 px-3">
            <span className="truncate text-sm text-ink">{nome}</span>
            <form action={logout}>
              <button type="submit" className="shrink-0 text-sm text-muted hover:text-ink">
                Esci
              </button>
            </form>
          </div>
        )}
      </div>
    </aside>
  );
}
