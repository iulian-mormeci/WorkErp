import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { ProfileForm } from "./profile-form";
import { PasswordForm } from "./password-form";
import { WorkScheduleEditor } from "./work-schedule-editor";

export default async function AccountPage() {
  const user = await requireUser();

  const schedules = await prisma.workSchedule.findMany({
    where: { userId: user.id },
  });

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-8 md:px-10 md:py-10">
      <header>
        <h1 className="text-xl font-semibold text-ink">Account</h1>
        <p className="mt-1 text-sm text-muted">Dati personali e orario di lavoro.</p>
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-ink">Dati personali</h2>
        <div className="rounded-lg border border-line bg-surface p-4">
          <ProfileForm nome={user.nome} email={user.email} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-ink">Password</h2>
        <div className="rounded-lg border border-line bg-surface p-4">
          <PasswordForm />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-ink">Orario di lavoro</h2>
        <p className="text-sm text-muted">
          Le fasce orarie configurate qui verranno usate per filtrare il calendario della
          dashboard.
        </p>
        <div className="rounded-lg border border-line bg-surface px-4">
          <WorkScheduleEditor schedules={schedules} />
        </div>
      </section>
    </div>
  );
}
