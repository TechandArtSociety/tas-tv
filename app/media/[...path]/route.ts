import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { resolve, sep } from "node:path";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const root = resolve(process.cwd(), "media");
  const file = resolve(root, ...path);
  const type = file.toLowerCase().endsWith(".mp4") ? "video/mp4" : file.toLowerCase().endsWith(".mp3") ? "audio/mpeg" : null;
  if (!file.startsWith(`${root}${sep}`) || !type) {
    return new Response("Introuvable", { status: 404 });
  }
  try {
    const info = await stat(file);
    const range = request.headers.get("range");
    const match = range?.match(/^bytes=(\d*)-(\d*)$/);
    let start = 0;
    let end = info.size - 1;
    if (match) {
      if (match[1]) start = Number(match[1]);
      if (match[2]) end = Number(match[2]);
      if (start > end || start >= info.size) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${info.size}` } });
      end = Math.min(end, info.size - 1);
    }
    const length = end - start + 1;
    const stream = createReadStream(file, { start, end });
    const headers = new Headers({
      "Accept-Ranges": "bytes",
      "Content-Type": type,
      "Content-Length": String(length),
      "Cache-Control": "public, max-age=3600",
    });
    if (match) headers.set("Content-Range", `bytes ${start}-${end}/${info.size}`);
    return new Response(Readable.toWeb(stream) as ReadableStream, { status: match ? 206 : 200, headers });
  } catch {
    return new Response("Introuvable", { status: 404 });
  }
}
