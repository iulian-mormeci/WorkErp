import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { logout } from "./logout-action";

export default async function Home() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <p className="text-lg text-gray-900">Ciao, {session.user.nome}</p>
      <form action={logout}>
        <button
          type="submit"
          className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          Esci
        </button>
      </form>
    </div>
  );
}
