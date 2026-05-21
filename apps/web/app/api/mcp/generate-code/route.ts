import { NextResponse } from "next/server";
import { getSessionOrThrow } from "@/lib/auth";
import { ApiErrors, handleApiError } from "@/lib/errors";
import { issueMcpVerificationCode } from "@/lib/mcp-auth";

export async function POST() {
  const context = "api:mcp:generate-code";

  try {
    const user = await getSessionOrThrow();
    if (!user.isOnboarded) {
      throw ApiErrors.FORBIDDEN("Complete onboarding before generating MCP access codes");
    }

    const issuedCode = issueMcpVerificationCode(user);
    return NextResponse.json({
      success: true,
      ...issuedCode,
    });
  } catch (error) {
    return handleApiError(error, context);
  }
}
