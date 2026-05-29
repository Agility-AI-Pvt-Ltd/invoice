import type { Prisma } from "@repo/db";
import { prisma } from "@repo/db";
import type { z } from "zod";
import type { ledgerCreateSchema, ledgerPatchSchema } from "./schemas";

export type ExpenseLedgerKindValue = "INCOME" | "EXPENSE";

export type SerializedExpenseLedgerEntry = {
  id: string;
  kind: ExpenseLedgerKindValue;
  category: string;
  amount: number;
  currency: string;
  occurredAt: string;
  description: string | null;
};

type LedgerCreateInput = z.infer<typeof ledgerCreateSchema>;
type LedgerPatchInput = z.infer<typeof ledgerPatchSchema>;

type ListLedgerOptions = {
  from?: string | null;
  to?: string | null;
  kind?: string | null;
  limit?: number;
  offset?: number;
};

const ledgerSelect = {
  id: true,
  kind: true,
  category: true,
  amount: true,
  currency: true,
  occurredAt: true,
  description: true,
} satisfies Prisma.ExpenseLedgerEntrySelect;

export function parseExpenseOccurredAt(raw: string): Date | null {
  const d = raw.includes("T") ? new Date(raw) : new Date(`${raw}T12:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function serializeExpenseLedgerEntry(
  row: Prisma.ExpenseLedgerEntryGetPayload<{ select: typeof ledgerSelect }>,
): SerializedExpenseLedgerEntry {
  return {
    ...row,
    kind: row.kind as ExpenseLedgerKindValue,
    amount: Number(row.amount),
    occurredAt: row.occurredAt.toISOString(),
  };
}

function clampInteger(value: number | undefined, fallback: number, min: number, max: number) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(Math.max(Math.trunc(value as number), min), max);
}

export function currentUtcMonthRange(now = new Date()) {
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return { from, to };
}

export async function listExpenseLedgerEntries(
  organizationId: string,
  options: ListLedgerOptions = {},
) {
  const where: Prisma.ExpenseLedgerEntryWhereInput = { organizationId };
  const limit = clampInteger(options.limit, 5000, 1, 5000);
  const offset = clampInteger(options.offset, 0, 0, 100_000);

  if (options.from || options.to) {
    const bounds: Prisma.DateTimeFilter = {};
    if (options.from) {
      const start = parseExpenseOccurredAt(options.from);
      if (!start) throw new Error("Invalid from date");
      bounds.gte = start;
    }
    if (options.to) {
      const end = parseExpenseOccurredAt(options.to);
      if (!end) throw new Error("Invalid to date");
      bounds.lte = end;
    }
    where.occurredAt = bounds;
  }

  if (options.kind === "INCOME" || options.kind === "EXPENSE") {
    where.kind = options.kind;
  }

  const [rows, total] = await Promise.all([
    prisma.expenseLedgerEntry.findMany({
      where,
      orderBy: { occurredAt: "desc" },
      take: limit,
      skip: offset,
      select: ledgerSelect,
    }),
    prisma.expenseLedgerEntry.count({ where }),
  ]);

  return {
    entries: rows.map(serializeExpenseLedgerEntry),
    total,
    hasMore: offset + rows.length < total,
  };
}

export async function createExpenseLedgerEntry(
  organizationId: string,
  input: LedgerCreateInput,
) {
  const occurredAt = parseExpenseOccurredAt(input.occurredAt);
  if (!occurredAt) throw new Error("Invalid occurredAt");

  const row = await prisma.expenseLedgerEntry.create({
    data: {
      organizationId,
      kind: input.kind,
      category: input.category.trim(),
      amount: input.amount,
      currency: input.currency ?? "INR",
      occurredAt,
      description: input.description?.trim() || null,
    },
    select: ledgerSelect,
  });

  return serializeExpenseLedgerEntry(row);
}

export async function updateExpenseLedgerEntry(
  organizationId: string,
  id: string,
  input: LedgerPatchInput,
) {
  const existing = await prisma.expenseLedgerEntry.findFirst({
    where: { id, organizationId },
    select: { id: true },
  });
  if (!existing) return null;

  let occurredAt: Date | undefined;
  if (input.occurredAt !== undefined) {
    const d = parseExpenseOccurredAt(input.occurredAt);
    if (!d) throw new Error("Invalid occurredAt");
    occurredAt = d;
  }

  const row = await prisma.expenseLedgerEntry.update({
    where: { id },
    data: {
      ...(input.kind !== undefined ? { kind: input.kind } : {}),
      ...(input.category !== undefined ? { category: input.category.trim() } : {}),
      ...(input.amount !== undefined ? { amount: input.amount } : {}),
      ...(input.currency !== undefined ? { currency: input.currency } : {}),
      ...(occurredAt !== undefined ? { occurredAt } : {}),
      ...(input.description !== undefined
        ? { description: input.description?.trim() || null }
        : {}),
    },
    select: ledgerSelect,
  });

  return serializeExpenseLedgerEntry(row);
}

export async function deleteExpenseLedgerEntry(organizationId: string, id: string) {
  const deleted = await prisma.expenseLedgerEntry.deleteMany({
    where: { id, organizationId },
  });

  return deleted.count > 0;
}

export function summarizeEntriesByCategory(entries: SerializedExpenseLedgerEntry[]) {
  const totals = new Map<string, number>();
  for (const entry of entries) {
    totals.set(entry.category, (totals.get(entry.category) ?? 0) + entry.amount);
  }

  return [...totals.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}
