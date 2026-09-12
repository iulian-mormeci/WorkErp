"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { sendPushToUser } from "@/lib/push";

export async function saveNotificationPreferences(formData: FormData) {
  const user = await requireUser();
  const bool = (name: string) => formData.get(name) === "on";

  const data = {
    scadenzaBrowser: bool("scadenzaBrowser"),
    scadenzaEmail: bool("scadenzaEmail"),
    statoBrowser: bool("statoBrowser"),
    statoEmail: bool("statoEmail"),
    posticipoBrowser: bool("posticipoBrowser"),
    posticipoEmail: bool("posticipoEmail"),
  };

  await prisma.notificationPreference.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...data },
    update: data,
  });

  revalidatePath("/impostazioni");
}

type SubscriptionJson = { endpoint: string; keys: { p256dh: string; auth: string } };

export async function savePushSubscription(subscription: SubscriptionJson) {
  const user = await requireUser();
  await prisma.pushSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    create: {
      userId: user.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    update: { userId: user.id, p256dh: subscription.keys.p256dh, auth: subscription.keys.auth },
  });
}

export async function deletePushSubscription(endpoint: string) {
  const user = await requireUser();
  await prisma.pushSubscription.deleteMany({ where: { endpoint, userId: user.id } });
}

export async function sendTestPush() {
  const user = await requireUser();
  await sendPushToUser(user.id, {
    title: "Notifica di prova",
    body: "Se la vedi, le notifiche push funzionano.",
    url: "/impostazioni",
  });
}
