import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { Sidebar } from "@/components/sidebar";
import { MobileNav } from "@/components/mobile-nav";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const isAdmin = session.user.ruolo === "ADMIN";

  return (
    <div className="flex min-h-screen">
      <Sidebar nome={session.user.nome} isAdmin={isAdmin} />
      <main className="min-w-0 flex-1 pb-20 md:pb-0">{children}</main>
      <MobileNav nome={session.user.nome} isAdmin={isAdmin} />
    </div>
  );
}
