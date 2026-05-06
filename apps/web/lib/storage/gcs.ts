import { Storage } from "@google-cloud/storage";

let cached: Storage | null = null;

function getStorage(): Storage {
  if (!cached) cached = new Storage();
  return cached;
}

export type SignedUploadParams = {
  bucket: string;
  objectKey: string;
  contentType: string;
  /** Time until the signed URL expires (ms). Default 15 minutes. */
  expiresInMs?: number;
};

/**
 * Returns a v4 signed URL for HTTP PUT upload to GCS.
 * On GCP (Cloud Run, GKE), use Workload Identity / default credentials.
 * Locally, set `GOOGLE_APPLICATION_CREDENTIALS` to a service account JSON path.
 */
export async function createGcsSignedPutUrl(params: SignedUploadParams) {
  const expires = Date.now() + (params.expiresInMs ?? 15 * 60 * 1000);
  const bucket = getStorage().bucket(params.bucket);
  const file = bucket.file(params.objectKey);
  const [url] = await file.getSignedUrl({
    version: "v4",
    action: "write",
    expires,
    contentType: params.contentType,
  });
  return {
    uploadUrl: url,
    objectKey: params.objectKey,
    bucket: params.bucket,
    gsUri: `gs://${params.bucket}/${params.objectKey}`,
  };
}
