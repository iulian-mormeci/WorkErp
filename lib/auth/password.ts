import * as argon2 from "argon2";

export function hashPassword(plain: string) {
  return argon2.hash(plain, { type: argon2.argon2id });
}

export function verifyPassword(hash: string, plain: string) {
  return argon2.verify(hash, plain);
}

// Hash fittizio per il login con email inesistente: verificarlo costa quanto
// una verifica reale, così il tempo di risposta non rivela se l'email esiste.
let dummyHash: Promise<string> | undefined;
export async function verifyAgainstDummy(plain: string) {
  dummyHash ??= hashPassword("dummy-password-for-timing");
  await argon2.verify(await dummyHash, plain);
  return false;
}
