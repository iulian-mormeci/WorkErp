import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  ListChecks,
  Wrench,
  BookOpen,
  StickyNote,
  CalendarDays,
  UserRound,
  Settings,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

// Voci mostrate nella sidebar (desktop/tablet) e, le prime quattro, nella
// bottom nav mobile: le restanti finiscono nel drawer "Altro".
export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/attivita", label: "Attività", icon: ListChecks },
  { href: "/lavori", label: "Lavori", icon: Wrench },
  { href: "/calendario", label: "Calendario", icon: CalendarDays },
  { href: "/manuali", label: "Manuali e guide", icon: BookOpen },
  { href: "/note", label: "Note", icon: StickyNote },
  { href: "/account", label: "Account", icon: UserRound },
  { href: "/impostazioni", label: "Impostazioni", icon: Settings },
];

export const MOBILE_PRIMARY_COUNT = 4;
