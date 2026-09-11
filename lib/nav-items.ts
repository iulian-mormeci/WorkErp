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
  ShieldCheck,
  Euro,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
  /** Chiave del conteggio realtime da mostrare come badge (vedi lib/realtime/counts.ts). */
  countKey?: "attivita" | "lavori";
};

// Voci mostrate nella sidebar (desktop/tablet) e, le prime quattro, nella
// bottom nav mobile: le restanti finiscono nel drawer "Altro". "Admin" è
// filtrata a runtime (vedi Sidebar/MobileNav) in base al ruolo dell'utente.
export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/attivita", label: "Attività", icon: ListChecks, countKey: "attivita" },
  { href: "/lavori", label: "Lavori", icon: Wrench, countKey: "lavori" },
  { href: "/calendario", label: "Calendario", icon: CalendarDays },
  { href: "/vendite", label: "Vendite", icon: Euro },
  { href: "/manuali", label: "Manuali e guide", icon: BookOpen },
  { href: "/note", label: "Note", icon: StickyNote },
  { href: "/account", label: "Account", icon: UserRound },
  { href: "/impostazioni", label: "Impostazioni", icon: Settings },
  { href: "/admin", label: "Admin", icon: ShieldCheck, adminOnly: true },
];

export const MOBILE_PRIMARY_COUNT = 4;
