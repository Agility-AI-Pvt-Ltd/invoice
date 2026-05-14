import { Camera, ScanLine, UploadCloud } from "lucide-react";

export default function ReceiptManagementPage() {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Capture receipts, run OCR, and attach files to transactions. Files stay
        encrypted at rest when storage hooks are enabled.
      </p>

      <div className="grid gap-4 lg:grid-cols-3">
        <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 px-6 py-12 text-center shadow-inner transition hover:border-primary hover:bg-primary/10">
          <UploadCloud className="h-10 w-10 text-primary" aria-hidden />
          <span className="text-sm font-bold text-foreground">
            Drop files or browse
          </span>
          <span className="text-xs text-muted-foreground">
            PNG, JPG, PDF up to 15 MB
          </span>
          <input type="file" accept="image/*,.pdf" className="hidden" multiple />
        </label>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-muted p-3">
              <ScanLine className="h-6 w-6 text-primary" aria-hidden />
            </div>
            <div>
              <h2 className="font-bold text-foreground">OCR pipeline</h2>
              <p className="text-xs text-muted-foreground">
                Vendor, GSTIN, totals, line tax hints
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Preview extraction runs client-side in beta; production ties into your
            secure document worker.
          </p>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-muted p-3">
              <Camera className="h-6 w-6 text-primary" aria-hidden />
            </div>
            <div>
              <h2 className="font-bold text-foreground">Mobile capture</h2>
              <p className="text-xs text-muted-foreground">
                Guided edges & glare detection
              </p>
            </div>
          </div>
          <button
            type="button"
            className="mt-6 w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90"
          >
            Open capture tips
          </button>
        </section>
      </div>
    </div>
  );
}
