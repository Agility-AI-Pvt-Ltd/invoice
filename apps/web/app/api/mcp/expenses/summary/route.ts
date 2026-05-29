import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/errors";
import { computeExpenseSummary } from "@/lib/expenses/summary";
import { getMcpApiSessionOrThrow } from "@/lib/mcp-api-auth";

export async function GET(req: Request) {
  const context = "api:mcp:expenses:summary";

  try {
    const { organization } = await getMcpApiSessionOrThrow(req.headers);
    const summary = await computeExpenseSummary(organization.id);

    return NextResponse.json({
      organization: {
        id: organization.id,
        name: organization.name,
        currency: organization.currency,
      },
      summary,
    });
  } catch (error) {
    return handleApiError(error, context);
  }
}
