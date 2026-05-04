import { readFile } from "node:fs/promises";
import path from "node:path";

export async function GET() {
  const filePath = path.join(process.cwd(), "public", "assets", "herobg.mp4");

  try {
    const file = await readFile(filePath);
    return new Response(file, {
      headers: {
        "Content-Type": "video/mp4",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return new Response("Video not found", { status: 404 });
  }
}
