import { getSessionOrThrow } from "@/lib/auth";
import { ApiErrors, handleApiError } from "@/lib/errors";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

function getInternalAppOrigin(req: Request) {
  const explicit = process.env.INTERNAL_APP_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }

  if (process.env.NODE_ENV !== "production") {
    const port = process.env.PORT?.trim() || "3000";
    return `http://127.0.0.1:${port}`;
  }

  const forwardedHost =
    req.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    req.headers.get("host")?.trim();
  const forwardedProto =
    req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https";

  if (!forwardedHost) {
    throw new Error("Unable to determine internal app origin");
  }

  return `${forwardedProto}://${forwardedHost}`;
}

function toSafeApiPath(path: string[]) {
  if (path.length === 0 || path.some((part) => !part || part === "." || part === "..")) {
    throw ApiErrors.BAD_REQUEST("Invalid MCP backend path");
  }

  const [resource = "", id = "", action = "", extra] = path;
  if (extra) {
    throw ApiErrors.NOT_FOUND("MCP backend path is not supported");
  }

  if (resource === "health" && path.length === 1) return "/api/health";
  if (resource === "customers" && path.length === 1) return "/api/customers";
  if (resource === "storage" && id === "sign-upload" && path.length === 2) {
    return "/api/storage/sign-upload";
  }
  if (resource === "reports" && id === "gstr1" && path.length === 2) {
    return "/api/reports/gstr1";
  }
  if (resource === "cron" && id === "process-recurring" && path.length === 2) {
    return "/api/cron/process-recurring";
  }
  if (resource === "recurring") {
    if (path.length === 1) return "/api/recurring";
    if (path.length === 2 && id) return `/api/recurring/${encodeURIComponent(id)}`;
    if ((action === "run" || action === "toggle") && path.length === 3) {
      return `/api/recurring/${encodeURIComponent(id)}/${action}`;
    }
  }
  if (resource === "invoices") {
    if (path.length === 1) return "/api/invoices";
    if (path.length === 2 && id) return `/api/invoices/${encodeURIComponent(id)}`;
    if (
      [
        "pdf",
        "payment",
        "payment-link",
        "send-email",
        "send-whatsapp",
      ].includes(action) &&
      path.length === 3
    ) {
      return `/api/invoices/${encodeURIComponent(id)}/${action}`;
    }
  }

  throw ApiErrors.NOT_FOUND("MCP backend path is not supported");
}

async function proxyToAppApi(req: Request, context: RouteContext) {
  const apiContext = "api:mcp:backend-proxy";

  try {
    await getSessionOrThrow();

    const { path } = await context.params;
    const safeApiPath = toSafeApiPath(path);
    const targetUrl = new URL(safeApiPath, `${getInternalAppOrigin(req)}/`);
    targetUrl.search = new URL(req.url).search;

    const headers = new Headers();
    for (const name of ["accept", "authorization", "content-type", "cookie"]) {
      const value = req.headers.get(name);
      if (value) headers.set(name, value);
    }
    const cronSecret = req.headers.get("x-invoicely-cron-secret");
    if (cronSecret && safeApiPath === "/api/cron/process-recurring") {
      headers.set("authorization", `Bearer ${cronSecret}`);
    }
    headers.set("x-invoicely-mcp-proxy", "1");

    const method = req.method.toUpperCase();
    const body =
      method === "GET" || method === "HEAD" ? undefined : await req.arrayBuffer();

    const response = await fetch(targetUrl, {
      method,
      headers,
      body,
      cache: "no-store",
    });

    const responseHeaders = new Headers();
    for (const name of ["content-type", "content-disposition", "cache-control"]) {
      const value = response.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }

    return new Response(await response.arrayBuffer(), {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    return handleApiError(error, apiContext);
  }
}

export async function GET(req: Request, context: RouteContext) {
  return proxyToAppApi(req, context);
}

export async function POST(req: Request, context: RouteContext) {
  return proxyToAppApi(req, context);
}
