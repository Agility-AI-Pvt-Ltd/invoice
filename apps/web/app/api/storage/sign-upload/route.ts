import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { env } from "@/lib/env";
import { createGcsSignedPutUrl } from "@/lib/storage/gcs";

const bodySchema = z.object({
  fileName: z.string().min(1).max(200),
  contentType: z.string().min(3).max(120),
});

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "file";
}

/**
 * POST { fileName, contentType } → v4 signed PUT URL scoped under org prefix (GCP).
 */
export async function POST(req: Request) {
  const bucket = env.GCS_BUCKET_NAME;
  if (!bucket) {
    return NextResponse.json(
      { error: "Object storage is not configured (set GCS_BUCKET_NAME)." },
      { status: 503 }
    );
  }

  const user = await getSession();
  const organizationId = user?.ownedOrgs?.[0]?.id;
  if (!organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "fileName and contentType are required" }, { status: 400 });
  }

  const { fileName, contentType } = parsed.data;
  const safe = sanitizeFileName(fileName);
  const objectKey = `orgs/${organizationId}/uploads/${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${safe}`;

  try {
    const signed = await createGcsSignedPutUrl({
      bucket,
      objectKey,
      contentType,
      expiresInMs: env.GCS_SIGN_UPLOAD_TTL_MS,
    });
    return NextResponse.json({
      ...signed,
      maxBytes: env.GCS_SIGN_UPLOAD_MAX_BYTES ?? null,
    });
  } catch (e) {
    console.error("[sign-upload]", e);
    return NextResponse.json({ error: "Failed to create upload URL" }, { status: 500 });
  }
}
