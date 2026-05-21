import crypto from "crypto";
import type { UserWithOrgs } from "./auth";
import { env, resolveMcpBackendSecret } from "./env";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const TOKEN_TYPE = "mcp_backend_access";
const TOKEN_SCOPE = ["invoice:api"] as const;

type McpTokenClaims = {
  sub: string;
  orgId: string;
  email: string;
  scope: string[];
  iat: number;
  exp: number;
  typ: typeof TOKEN_TYPE;
};

type StoredMcpVerificationCode = {
  userId: string;
  organizationId: string;
  email: string;
  expiresAt: number;
};

declare global {
  var __mcpVerificationCodes:
    | Map<string, StoredMcpVerificationCode>
    | undefined;
}

const verificationCodes =
  globalThis.__mcpVerificationCodes ??
  new Map<string, StoredMcpVerificationCode>();

if (process.env.NODE_ENV !== "production") {
  globalThis.__mcpVerificationCodes = verificationCodes;
}

function getNowSeconds() {
  return Math.floor(Date.now() / 1000);
}

function normalizeCode(code: string) {
  return code.trim().toUpperCase();
}

function hmac(value: string) {
  return crypto
    .createHmac("sha256", resolveMcpBackendSecret())
    .update(value)
    .digest("base64url");
}

function hashVerificationCode(code: string) {
  return hmac(`mcp-code:${normalizeCode(code)}`);
}

function timingSafeEqualString(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function createVerificationCode() {
  let code = "";
  const randomValues = new Uint8Array(8);
  if (typeof globalThis.crypto !== "undefined" && globalThis.crypto.getRandomValues) {
    globalThis.crypto.getRandomValues(randomValues);
  } else {
    // Fallback if somehow globalThis.crypto is unavailable
    for (let i = 0; i < 8; i++) {
        randomValues[i] = Math.floor(Math.random() * 256);
    }
  }
  
  for (let index = 0; index < 8; index += 1) {
    code += CODE_ALPHABET[randomValues[index] % CODE_ALPHABET.length];
  }
  return code;
}

function encodeJson(value: unknown) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function decodeJson<T>(value: string): T | null {
  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

function signTokenClaims(claims: McpTokenClaims) {
  const header = encodeJson({ alg: "HS256", typ: "JWT" });
  const payload = encodeJson(claims);
  const signature = hmac(`${header}.${payload}`);
  return `${header}.${payload}.${signature}`;
}

export function issueMcpVerificationCode(user: UserWithOrgs) {
  const organizationId = user.ownedOrgs[0]?.id;
  if (!organizationId) {
    throw new Error("No organization available for MCP access");
  }

  const expiresIn = env.MCP_VERIFICATION_CODE_TTL_SECONDS;
  const expiresAt = Date.now() + expiresIn * 1000;
  const code = createVerificationCode();

  verificationCodes.set(hashVerificationCode(code), {
    userId: user.id,
    organizationId,
    email: user.email,
    expiresAt,
  });

  return {
    code,
    expiresAt: new Date(expiresAt).toISOString(),
    expiresIn,
  };
}

export function exchangeMcpVerificationCode(code: string) {
  const hashedCode = hashVerificationCode(code);
  const stored = verificationCodes.get(hashedCode);
  verificationCodes.delete(hashedCode);

  if (!stored || stored.expiresAt <= Date.now()) {
    return null;
  }

  const issuedAt = getNowSeconds();
  const expiresIn = env.MCP_BACKEND_TOKEN_TTL_SECONDS;
  const expiresAt = issuedAt + expiresIn;
  const claims: McpTokenClaims = {
    sub: stored.userId,
    orgId: stored.organizationId,
    email: stored.email,
    scope: [...TOKEN_SCOPE],
    iat: issuedAt,
    exp: expiresAt,
    typ: TOKEN_TYPE,
  };

  return {
    valid: true,
    subject: claims.sub,
    organizationId: claims.orgId,
    email: claims.email,
    backendAccessToken: signTokenClaims(claims),
    expiresAt,
    expiresIn,
    scope: claims.scope,
  };
}

export function verifyMcpBackendToken(token: string): McpTokenClaims | null {
  const [header, payload, signature] = token.split(".");
  if (!header || !payload || !signature) return null;

  const expectedSignature = hmac(`${header}.${payload}`);
  if (!timingSafeEqualString(signature, expectedSignature)) return null;

  const claims = decodeJson<McpTokenClaims>(payload);
  if (!claims) return null;
  if (claims.typ !== TOKEN_TYPE) return null;
  if (!claims.sub || !claims.orgId || !claims.email) return null;
  if (!Array.isArray(claims.scope) || !claims.scope.includes(TOKEN_SCOPE[0])) {
    return null;
  }
  if (!Number.isFinite(claims.exp) || claims.exp <= getNowSeconds()) {
    return null;
  }

  return claims;
}

export function getMcpBearerToken(headers: Headers) {
  const authHeader = headers.get("authorization");
  if (!authHeader) return null;

  const [scheme, token] = authHeader.split(/\s+/, 2);
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;

  return token;
}
