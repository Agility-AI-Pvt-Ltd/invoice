import { prisma, Prisma } from "@repo/db";

type LoginUserRow = {
  id: string;
  email: string;
  password: string | null;
  isOnboarded: boolean;
};

/** Match email case-insensitively and ignore accidental whitespace in stored values. */
export async function findUserByEmailForLogin(
  normalizedEmail: string,
): Promise<LoginUserRow | null> {
  const rows = await prisma.$queryRaw<LoginUserRow[]>(
    Prisma.sql`
      SELECT id, email, password, "isOnboarded"
      FROM "User"
      WHERE LOWER(TRIM(email)) = ${normalizedEmail}
      LIMIT 1
    `,
  );
  return rows[0] ?? null;
}
