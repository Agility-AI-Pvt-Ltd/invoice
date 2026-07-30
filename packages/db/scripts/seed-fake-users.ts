/**
 * Seeds fake users with realistic Indian names and @gmail.com emails.
 *
 * Usage (from repo root):
 *   npm run db:seed-fake-users
 *   npm run db:seed-fake-users -- --count 2000
 *   npm run db:seed-fake-users -- --count 2000 --purge
 */
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as sleep } from "node:timers/promises";
import dotenv from "dotenv";
import { hash } from "bcryptjs";
import { prisma } from "@repo/db";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = join(__dirname, "..");
const DATA_DIR = join(PACKAGE_ROOT, "data");
const CREDENTIALS_JSON = join(DATA_DIR, "fake-users-credentials.json");
const CREDENTIALS_CSV = join(DATA_DIR, "fake-users-credentials.csv");

dotenv.config({ path: join(PACKAGE_ROOT, ".env") });

const FIRST_NAMES = [
  "Aarav",
  "Aditi",
  "Akash",
  "Amit",
  "Ananya",
  "Aniket",
  "Anjali",
  "Arjun",
  "Ashok",
  "Bhavna",
  "Chaitanya",
  "Deepa",
  "Deepak",
  "Devika",
  "Divya",
  "Gaurav",
  "Harish",
  "Isha",
  "Karan",
  "Kavita",
  "Kiran",
  "Lakshmi",
  "Manish",
  "Meera",
  "Neha",
  "Nikhil",
  "Nisha",
  "Pooja",
  "Pranav",
  "Priya",
  "Rahul",
  "Rajesh",
  "Ravi",
  "Riya",
  "Rohit",
  "Sanjay",
  "Shreya",
  "Siddharth",
  "Sneha",
  "Suresh",
  "Swati",
  "Varun",
  "Vikram",
  "Vivek",
];

const LAST_NAMES = [
  "Agarwal",
  "Banerjee",
  "Bhat",
  "Chatterjee",
  "Chopra",
  "Das",
  "Desai",
  "Dubey",
  "Ghosh",
  "Gupta",
  "Iyer",
  "Jain",
  "Joshi",
  "Kapoor",
  "Khan",
  "Kulkarni",
  "Malhotra",
  "Mehta",
  "Menon",
  "Mishra",
  "Nair",
  "Patel",
  "Pillai",
  "Rao",
  "Reddy",
  "Saxena",
  "Shah",
  "Sharma",
  "Singh",
  "Srinivasan",
  "Trivedi",
  "Verma",
];

const EMAIL_SUFFIX = "@gmail.com";
const BATCH_SIZE = 20;
const MAX_RETRIES = 5;

type GeneratedUser = {
  name: string;
  email: string;
  password: string;
};

type CredentialsFile = {
  generatedAt: string;
  seed: string;
  count: number;
  databaseHint: string;
  users: GeneratedUser[];
};

function parseArgs(argv: string[]) {
  let count = 2000;
  let purge = false;
  let seed = "fake-users-v1";

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--count" && argv[i + 1]) {
      count = Math.max(1, Number.parseInt(argv[i + 1]!, 10) || count);
      i++;
    } else if (argv[i] === "--seed" && argv[i + 1]) {
      seed = argv[i + 1]!;
      i++;
    } else if (argv[i] === "--purge") {
      purge = true;
    }
  }

  return { count, purge, seed };
}

function normalizeToken(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[^\w]/g, "")
    .toLowerCase();
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, items: T[]) {
  return items[Math.floor(rng() * items.length)]!;
}

function createPassword(seed: string, index: number) {
  const digest = createHash("sha256")
    .update(`${seed}:${index}`)
    .digest("hex")
    .slice(0, 8);
  return `Demo@${digest}!9`;
}

function buildEmail(
  rng: () => number,
  firstName: string,
  lastName: string,
  usedEmails: Set<string>,
  fallbackIndex: number,
) {
  const first = normalizeToken(firstName);
  const last = normalizeToken(lastName);
  const patterns = [
    () => `${first}.${last}${Math.floor(rng() * 9000 + 1000)}`,
    () => `${first}${last}${Math.floor(rng() * 900 + 100)}`,
    () => `${first[0]}${last}${Math.floor(rng() * 9000 + 1000)}`,
    () => `${first}_${last}${Math.floor(rng() * 900 + 100)}`,
    () => `${first}.${last[0]}${Math.floor(rng() * 90000 + 10000)}`,
  ];

  for (let attempt = 0; attempt < 40; attempt++) {
    const localPart = pick(rng, patterns)();
    const email = `${localPart}${EMAIL_SUFFIX}`;
    if (!usedEmails.has(email)) {
      usedEmails.add(email);
      return email;
    }
  }

  const fallback = `${first}.${last}.${fallbackIndex}${EMAIL_SUFFIX}`;
  usedEmails.add(fallback);
  return fallback;
}

function generateUsers(count: number, seed: string) {
  const rng = mulberry32(
    Number.parseInt(createHash("sha256").update(seed).digest("hex").slice(0, 8), 16),
  );
  const usedEmails = new Set<string>();
  const users: GeneratedUser[] = [];

  for (let i = 0; i < count; i++) {
    const firstName = pick(rng, FIRST_NAMES);
    const lastName = pick(rng, LAST_NAMES);
    const name = `${firstName} ${lastName}`;
    const email = buildEmail(rng, firstName, lastName, usedEmails, i + 1);
    const password = createPassword(seed, i + 1);

    users.push({ name, email, password });
  }

  return users;
}

function databaseHint(url: string) {
  try {
    const parsed = new URL(url);
    return `${parsed.hostname}${parsed.pathname}`;
  } catch {
    return "unknown";
  }
}

function writeCredentialsFile(payload: CredentialsFile) {
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(CREDENTIALS_JSON, JSON.stringify(payload, null, 2), "utf8");

  const csvHeader = "name,email,password\n";
  const csvRows = payload.users
    .map((user) => {
      const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
      return [escape(user.name), escape(user.email), escape(user.password)].join(",");
    })
    .join("\n");
  writeFileSync(CREDENTIALS_CSV, csvHeader + csvRows, "utf8");
}

async function purgeFromCredentialsFile() {
  let emails: string[] = [];
  try {
    const raw = readFileSync(CREDENTIALS_JSON, "utf8");
    const parsed = JSON.parse(raw) as CredentialsFile;
    emails = parsed.users.map((user) => user.email);
  } catch {
    console.log("No existing credentials file to purge from.");
    return 0;
  }

  if (emails.length === 0) return 0;

  const deleted = await prisma.user.deleteMany({
    where: { email: { in: emails } },
  });

  console.log(`Purged ${deleted.count} users from previous seed file.`);
  return deleted.count;
}

async function purgePartialGmailUsers() {
  const deleted = await prisma.user.deleteMany({
    where: { email: { endsWith: EMAIL_SUFFIX } },
  });
  if (deleted.count > 0) {
    console.log(`Purged ${deleted.count} leftover @gmail.com users from a partial run.`);
  }
}

async function insertBatch(batch: GeneratedUser[]) {
  const hashed = await Promise.all(
    batch.map(async (user) => ({
      name: user.name,
      email: user.email,
      password: await hash(user.password, 10),
      isOnboarded: true,
    })),
  );

  return prisma.user.createMany({
    data: hashed,
    skipDuplicates: true,
  });
}

async function insertUsers(users: GeneratedUser[]) {
  let created = 0;
  let skipped = 0;

  for (let offset = 0; offset < users.length; offset += BATCH_SIZE) {
    const batch = users.slice(offset, offset + BATCH_SIZE);

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const result = await insertBatch(batch);
        created += result.count;
        skipped += batch.length - result.count;
        break;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (attempt === MAX_RETRIES) throw error;
        console.warn(
          `Batch ${offset + 1}-${offset + batch.length} failed (attempt ${attempt}/${MAX_RETRIES}): ${message}`,
        );
        await sleep(1500 * attempt);
      }
    }

    if ((offset + batch.length) % 200 === 0 || offset + batch.length === users.length) {
      console.log(`  ${Math.min(offset + batch.length, users.length)}/${users.length}`);
    }

    await sleep(100);
  }

  return { created, skipped };
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required (set in packages/db/.env)");
  }

  const { count, purge, seed } = parseArgs(process.argv.slice(2));

  if (purge) {
    await purgeFromCredentialsFile();
  } else {
    await purgePartialGmailUsers();
  }

  console.log(`Generating ${count} fake users for ${databaseHint(databaseUrl)}...`);
  const users = generateUsers(count, seed);

  const payload: CredentialsFile = {
    generatedAt: new Date().toISOString(),
    seed,
    count: users.length,
    databaseHint: databaseHint(databaseUrl),
    users,
  };

  writeCredentialsFile(payload);
  console.log(`Saved credentials before insert:\n  ${CREDENTIALS_JSON}\n  ${CREDENTIALS_CSV}`);

  console.log("Inserting users...");
  const { created, skipped } = await insertUsers(users);

  console.log(
    `Done. Inserted ${created}/${users.length} users (${skipped} already existed).`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
