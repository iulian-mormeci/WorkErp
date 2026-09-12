import Link from "next/link";
import { GripVertical, type LucideIcon } from "lucide-react";

export function WidgetShell({
  title,
  icon: Icon,
  href,
  scrollable = true,
  children,
}: {
  title: string;
  icon: LucideIcon;
  href: string;
  // Alcuni widget (es. il mini-calendario) si adattano sempre esattamente
  // all'altezza disponibile e non devono mai scrollare — per quelli si
  // passa `scrollable={false}` invece dell'overflow-y-auto di default.
  scrollable?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-line bg-surface p-3">
      <div className="mb-2 flex shrink-0 items-center gap-1.5">
        <span
          className="widget-drag-handle flex shrink-0 cursor-grab touch-none items-center active:cursor-grabbing"
          aria-hidden="true"
        >
          <GripVertical className="size-4 text-muted" />
        </span>
        <Link
          href={href}
          className="flex min-w-0 flex-1 items-center gap-1.5 text-sm font-medium text-ink hover:text-pine-strong"
        >
          <Icon className="size-4 shrink-0" />
          <span className="truncate">{title}</span>
        </Link>
      </div>
      <div className={`min-h-0 flex-1 ${scrollable ? "overflow-y-auto" : "overflow-hidden"}`}>{children}</div>
    </div>
  );
}
