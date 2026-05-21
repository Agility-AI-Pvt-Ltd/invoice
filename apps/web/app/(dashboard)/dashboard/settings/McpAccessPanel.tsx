import { ExternalLink, KeyRound, RefreshCw, ShieldCheck } from "lucide-react";

const MCP_LOGIN_URL = "https://invoicely-mcp-server.onrender.com/oauth/login";

export function McpAccessPanel({
  code,
  expiresAt,
  generateAction,
}: {
  code?: string;
  expiresAt?: string;
  generateAction: (formData: FormData) => Promise<void>;
}) {
  const expiresLabel = expiresAt
    ? new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Kolkata",
      }).format(new Date(expiresAt))
    : null;

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm shadow-black/5">
      <div className="px-6 py-5 border-b border-border/50 flex items-center gap-4 bg-secondary/10">
        <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center flex-shrink-0 text-indigo-500">
          <KeyRound className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-tight">
              API & MCP Access
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-600 rounded-full border border-emerald-500/20 uppercase tracking-wider">
              Active
            </span>
          </div>
          <p className="text-xs text-muted-foreground/70 mt-0.5">
            Connect Claude to your Invoicely workspace with a short-lived code.
          </p>
        </div>
      </div>

      <div className="p-6 md:p-8 space-y-6">
        <div className="flex items-start gap-3 text-xs text-muted-foreground leading-relaxed">
          <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
          <p>
            Codes are single-use and expire quickly. The MCP backend receives a
            scoped token for your current organization only.
          </p>
        </div>

        {code && (
          <div className="rounded-xl border border-border bg-secondary/30 px-5 py-4">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] mb-2">
              Claude MCP verification
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <code className="font-mono text-3xl sm:text-4xl font-black tracking-[0.18em] text-foreground">
                  {code}
                </code>
                {expiresLabel && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Expires {expiresLabel}
                  </p>
                )}
              </div>
              <a
                href={MCP_LOGIN_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-sm font-bold text-background hover:opacity-90 transition-opacity"
              >
                Open MCP Login
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        )}

        <form action={generateAction} className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            {code ? "Generate New Code" : "Generate Code"}
          </button>
          <p className="text-xs text-muted-foreground">
            Paste the generated code into the hosted MCP login page.
          </p>
        </form>
      </div>
    </div>
  );
}
