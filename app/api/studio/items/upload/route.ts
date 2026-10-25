import { mkdir, writeFile } from "node:fs/promises";
import { basename, extname, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isStudioAuthenticated } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!(await isStudioAuthenticated())) return NextResponse.json({ error: "Sign-in required." }, { status: 401 });
  const form = await request.formData();
  const file = form.get("file");
  const title = String(form.get("title") ?? "").trim();
  const creator = String(form.get("creator") ?? "").trim();
  const lang = String(form.get("lang") ?? "").trim().toLowerCase();
  const durationS = Number(form.get("duration_s"));
  const rights = form.get("rights") === "cleared" ? "cleared" : "pending";
  const rightsNote = String(form.get("rights_note") ?? "").trim();
  if (!(file instanceof File) || !title || !creator || !lang || !Number.isFinite(durationS) || durationS < 1) {
    return NextResponse.json({ error: "File, title, creator, language and duration are required." }, { status: 400 });
  }
  if (extname(file.name).toLowerCase() !== ".mp4" || file.size > 500 * 1024 * 1024) {
    return NextResponse.json({ error: "An MP4 file is required (500 MB max)." }, { status: 400 });
  }
  const folder = resolve(process.cwd(), "media/uploads");
  await mkdir(folder, { recursive: true });
  const safeName = basename(file.name).replace(/[^a-zA-Z0-9._-]/g, "-").slice(-100);
  const storedName = `${randomUUID()}-${safeName}`;
  await writeFile(resolve(folder, storedName), Buffer.from(await file.arrayBuffer()));
  const sql = db();
  const existing = await sql`select id from creators where name = ${creator} limit 1`;
  const creatorId = existing[0]?.id ?? (await sql`
    insert into creators (name, channel_url, lang, consent_at)
    values (${creator}, 'https://techandartsociety.com', ${lang}, now()) returning id
  `)[0].id;
  const inserted = await sql`
    insert into items (kind, src, title, creator_id, duration_s, lang, rights, rights_note)
    values ('file', ${`/media/uploads/${storedName}`}, ${title}, ${creatorId}, ${Math.ceil(durationS)}, ${lang}, ${rights}, ${rightsNote || null})
    returning id
  `;
  return NextResponse.json({ id: inserted[0].id }, { status: 201 });
}
