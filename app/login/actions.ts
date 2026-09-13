"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { checkRateLimit, resetRateLimit } from "@/lib/auth/rate-limit";

export type LoginState = { error?: string } | undefined;

// Per account: protegge dal brute force su una email specifica, a
// prescindere da dove arrivino i tentativi. Per IP: protegge da chi prova
// tante email diverse dallo stesso posto — soglia più larga perché più
// persone possono condividere lo stesso IP (es. un ufficio).
const MAX_ATTEMPTS_PER_EMAIL = 8;
const MAX_ATTEMPTS_PER_IP = 30;

// Dietro Caddy (unico reverse proxy davanti all'app, vedi
// docker-compose.prod.yml) X-Forwarded-For ha l'IP reale del client come
// ULTIMO valore: Caddy accoda sempre il proprio hop, un client non può
// sovrascriverlo, solo aggiungere valori finti PRIMA di esso.
async function getClientIp(): Promise<string> {
  const forwardedFor = (await headers()).get("x-forwarded-for");
  if (!forwardedFor) return "unknown";
  const parts = forwardedFor.split(",").map((p) => p.trim());
  return parts[parts.length - 1] || "unknown";
}

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Inserisci email e password." };
  }

  const ip = await getClientIp();
  const emailLimit = checkRateLimit(`login:email:${email}`, MAX_ATTEMPTS_PER_EMAIL);
  const ipLimit = checkRateLimit(`login:ip:${ip}`, MAX_ATTEMPTS_PER_IP);

  if (!emailLimit.allowed || !ipLimit.allowed) {
    const retryMinutes = Math.ceil(Math.max(emailLimit.retryAfterMs, ipLimit.retryAfterMs) / 60_000);
    return { error: `Troppi tentativi. Riprova tra ${retryMinutes} minut${retryMinutes === 1 ? "o" : "i"}.` };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  const valid = user ? await verifyPassword(user.passwordHash, password) : false;

  if (!user || !valid) {
    return { error: "Credenziali non valide." };
  }

  resetRateLimit(`login:email:${email}`);
  resetRateLimit(`login:ip:${ip}`);

  await createSession(user.id);
  redirect("/");
}
