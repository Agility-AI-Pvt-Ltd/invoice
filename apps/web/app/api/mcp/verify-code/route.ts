import { NextResponse } from "next/server";
import { ApiErrors, handleApiError } from "@/lib/errors";
import { exchangeMcpVerificationCode } from "@/lib/mcp-auth";
import { apiRateLimit, enforceRateLimit } from "@/lib/ratelimit-api";

function getClientIp(req: Request) {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip") || "unknown";
}

export async function POST(req: Request) {
  const context = "api:mcp:verify-code";

  try {
    await enforceRateLimit(`mcp:verify-code:${getClientIp(req)}`, apiRateLimit);

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw ApiErrors.BAD_REQUEST("Invalid JSON body");
    }

    const code =
      body && typeof body === "object" && "code" in body
        ? (body as { code?: unknown }).code
        : null;

    if (typeof code !== "string" || !code.trim()) {
      throw ApiErrors.BAD_REQUEST("code is required");
    }

    const result = await exchangeMcpVerificationCode(code);
    if (!result) {
      return NextResponse.json(
        { valid: false, error: "Invalid or expired MCP verification code" },
        { status: 401 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error, context);
  }
}
