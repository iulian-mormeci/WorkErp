import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/push";
import { sendEmail } from "@/lib/email";

export type NotificationTipo = "scadenza" | "stato" | "posticipo";

const DEFAULT_PREFERENCE = {
  scadenzaBrowser: true,
  scadenzaEmail: false,
  statoBrowser: true,
  statoEmail: false,
  posticipoBrowser: true,
  posticipoEmail: false,
};

// Nessuna riga in NotificationPreference = valori di default: creata solo
// quando l'utente cambia qualcosa dalla pagina preferenze, non ad ogni login.
async function getPreference(userId: string) {
  const pref = await prisma.notificationPreference.findUnique({ where: { userId } });
  return pref ?? { userId, ...DEFAULT_PREFERENCE };
}

export async function notifyUser(
  userId: string,
  tipo: NotificationTipo,
  payload: { title: string; body: string; url?: string }
) {
  const [pref, user] = await Promise.all([
    getPreference(userId),
    prisma.user.findUnique({ where: { id: userId }, select: { email: true } }),
  ]);

  const wantsBrowser = pref[`${tipo}Browser` as const];
  const wantsEmail = pref[`${tipo}Email` as const];

  await Promise.all([
    wantsBrowser ? sendPushToUser(userId, payload) : Promise.resolve(),
    wantsEmail && user ? sendEmail(user.email, payload.title, payload.body) : Promise.resolve(),
  ]);
}

const DEADLINE_WINDOW_MS = 24 * 60 * 60 * 1000;

function formatShortDate(date: Date) {
  return date.toLocaleDateString("it-IT", { day: "numeric", month: "short" });
}

/**
 * Chiamata dal cron orario: Task/Job non completati con scadenza entro le
 * prossime 24h e non ancora notificati per QUELLA scadenza (vedi
 * `scadenzaNotificataAt`, azzerato ogni volta che la scadenza cambia).
 */
export async function checkUpcomingDeadlines() {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + DEADLINE_WINDOW_MS);

  const [tasks, jobs] = await Promise.all([
    prisma.task.findMany({
      where: {
        stato: { not: "COMPLETATO" },
        scadenza: { gte: now, lte: windowEnd },
        scadenzaNotificataAt: null,
      },
    }),
    prisma.job.findMany({
      where: {
        stato: { notIn: ["completato", "annullato"] },
        scadenza: { gte: now, lte: windowEnd },
        scadenzaNotificataAt: null,
      },
    }),
  ]);

  for (const task of tasks) {
    await notifyUser(task.userId, "scadenza", {
      title: "Scadenza in arrivo",
      body: `${task.titolo} — entro il ${formatShortDate(task.scadenza!)}`,
      url: `/attivita/${task.id}`,
    });
    await prisma.task.update({ where: { id: task.id }, data: { scadenzaNotificataAt: now } });
  }

  for (const job of jobs) {
    await notifyUser(job.userId, "scadenza", {
      title: "Scadenza lavoro in arrivo",
      body: `${job.titolo} — entro il ${formatShortDate(job.scadenza!)}`,
      url: `/lavori/${job.id}`,
    });
    await prisma.job.update({ where: { id: job.id }, data: { scadenzaNotificataAt: now } });
  }

  return { tasks: tasks.length, jobs: jobs.length };
}
