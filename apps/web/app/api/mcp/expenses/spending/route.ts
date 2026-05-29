import { NextResponse } from "next/server";
import { ApiErrors, handleApiError } from "@/lib/errors";
import {
  currentUtcMonthRange,
  listExpenseLedgerEntries,
  summarizeEntriesByCategory,
} from "@/lib/expenses/ledger";
import { getMcpApiSessionOrThrow } from "@/lib/mcp-api-auth";

function numberParam(value: string | null) {
  if (value === null || value.trim() === "") return undefined;
  return Number(value);
}

export async function GET(req: Request) {
  const context = "api:mcp:expenses:spending";

  try {
    const { organization } = await getMcpApiSessionOrThrow(req.headers);
    const url = new URL(req.url);
    const monthRange = currentUtcMonthRange();
    const from = url.searchParams.get("from") ?? monthRange.from.toISOString();
    const to =
      url.searchParams.get("to") ??
      new Date(monthRange.to.getTime() - 1).toISOString();

    const result = await listExpenseLedgerEntries(organization.id, {
      from,
      to,
      kind: "EXPENSE",
      limit: numberParam(url.searchParams.get("limit")),
      offset: numberParam(url.searchParams.get("offset")),
    });

    return NextResponse.json({
      organization: {
        id: organization.id,
        name: organization.name,
        currency: organization.currency,
      },
      kind: "EXPENSE",
      from,
      to,
      categories: summarizeEntriesByCategory(result.entries),
      ...result,
    });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Invalid ")) {
      return handleApiError(ApiErrors.BAD_REQUEST(error.message), context);
    }
    return handleApiError(error, context);
  }
}
