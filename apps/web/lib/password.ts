import { compare, hash } from "bcryptjs";
import { timingSafeEqual } from "node:crypto";

const BCRYPT_HASH = /^\$2[aby]\$\d{2}\$/;

export function isBcryptHash(stored: string): boolean {
  return BCRYPT_HASH.test(stored);
}

/** Verify password against bcrypt hash or legacy plain-text (Neon manual inserts). */
export async function verifyPassword(
  plain: string,
  stored: string,
): Promise<boolean> {
  if (isBcryptHash(stored)) {
    return compare(plain, stored);
  }

  const a = Buffer.from(plain, "utf8");
  const b = Buffer.from(stored, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function hashPassword(plain: string): Promise<string> {
  return hash(plain, 10);
}
