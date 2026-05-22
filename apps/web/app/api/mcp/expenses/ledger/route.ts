import { NextResponse } from "next/server";
import { ApiErrors, handleApiError } from "@/lib/errors";
import {
  createExpenseLedgerEntry,
  listExpenseLedgerEntries,
} from "@/lib/expenses/ledger";
import { ledgerCreateSchema } from "@/lib/expenses/schemas";
import { getMcpApiSessionOrThrow } from "@/lib/mcp-api-auth";

function numberParam(value: string | null) {
  if (value === null || value.trim() === "") return undefined;
  return Number(value);
}

export async function GET(req: Request) {
  const context = "api:mcp:expenses:ledger:list";

  try {
    const { organization } = await getMcpApiSessionOrThrow(req.headers);
    const url = new URL(req.url);
    const result = await listExpenseLedgerEntries(organization.id, {
      from: url.searchParams.get("from"),
      to: url.searchParams.get("to"),
      kind: url.searchParams.get("kind"),
      limit: numberParam(url.searchParams.get("limit")),
      offset: numberParam(url.searchParams.get("offset")),
    });

    return NextResponse.json({
      organization: {
        id: organization.id,
        name: organization.name,
        currency: organization.currency,
      },
      ...result,
    });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Invalid ")) {
      return handleApiError(ApiErrors.BAD_REQUEST(error.message), context);
    }
    return handleApiError(error, context);
  }
}

export async function POST(req: Request) {
  const context = "api:mcp:expenses:ledger:create";

  try {
    const { organization } = await getMcpApiSessionOrThrow(req.headers);
    const json = await req.json();
    const parsed = ledgerCreateSchema.safeParse(json);
    if (!parsed.success) {
      throw ApiErrors.BAD_REQUEST(
        parsed.error.issues.map((issue) => issue.message).join(", "),
        parsed.error.issues,
      );
    }

    const entry = await createExpenseLedgerEntry(organization.id, parsed.data);

    return NextResponse.json(
      {
        organization: {
          id: organization.id,
          name: organization.name,
          currency: organization.currency,
        },
        entry,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Invalid ")) {
      return handleApiError(ApiErrors.BAD_REQUEST(error.message), context);
    }
    return handleApiError(error, context);
  }
}
