import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { hashPassword } from "@/lib/auth/password";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const nome = process.env.ADMIN_NOME ?? "Admin";

  if (!email || !password) {
    throw new Error(
      "Imposta ADMIN_EMAIL e ADMIN_PASSWORD nell'ambiente prima di eseguire il seed."
    );
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, nome, ruolo: "ADMIN" },
    create: { email, passwordHash, nome, ruolo: "ADMIN" },
  });

  console.log(`Utente pronto: ${user.email} (${user.id})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
