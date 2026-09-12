import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getVapidPublicKey } from "@/lib/push";
import { UnoErpCard } from "./unoerp-card";
import { NotificationsCard } from "./notifications-card";

const DEFAULT_PREFERENCES = {
  scadenzaBrowser: true,
  scadenzaEmail: false,
  statoBrowser: true,
  statoEmail: false,
  posticipoBrowser: true,
  posticipoEmail: false,
};

export default async function ImpostazioniPage() {
  const user = await requireUser();
  const preference = await prisma.notificationPreference.findUnique({ where: { userId: user.id } });

  return (
    <div className="flex flex-col gap-6 px-6 py-8 md:px-10 md:py-10">
      <header>
        <h1 className="text-xl font-semibold text-ink">Impostazioni</h1>
        <p className="mt-1 text-sm text-muted">Preferenze generali e integrazioni.</p>
      </header>

      <UnoErpCard />
      <NotificationsCard
        vapidPublicKey={getVapidPublicKey()}
        preferences={preference ?? DEFAULT_PREFERENCES}
      />
    </div>
  );
}
