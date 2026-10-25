import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isStudioAuthenticated } from "@/lib/auth";

export const runtime = "nodejs";

type ItemInput = {
  title?: string;
  creator?: string;
  lang?: string;
  duration_s?: number;
  rights?: "cleared" | "pending" | "refused";
  rights_note?: string;
  kind?: "file" | "youtube";
  src?: string;
};

async function getCreatorId(name: string, lang: string) {
  const sql = db();
  const existing = await sql`select id from creators where name = ${name} limit 1`;
  if (existing[0]) return existing[0].id as string;
  const created = await sql`
    insert into creators (name, channel_url, lang, consent_at)
    values (${name}, 'https://techandartsociety.com', ${lang}, now())
    returning id
  `;
  return created[0].id as string;
}

export async function GET() {
  if (!(await isStudioAuthenticated())) return NextResponse.json({ error: "Sign-in required." }, { status: 401 });
  const sql = db();
  const items = await sql`
    select i.id, i.kind, i.src, i.title, i.duration_s, i.lang, i.rights, i.rights_note,
           i.subtitles, i.summary, i.tags, i.mood, i.ingest_status, i.created_at,
           c.name as creator, c.channel_url
    from items i join creators c on c.id = i.creator_id
    order by i.created_at desc, i.title
  `;
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  if (!(await isStudioAuthenticated())) return NextResponse.json({ error: "Sign-in required." }, { status: 401 });
  let input: ItemInput;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const title = input.title?.trim();
  const creator = input.creator?.trim();
  const lang = input.lang?.trim().toLowerCase();
  const durationS = Number(input.duration_s);
  const rights = input.rights === "cleared" ? "cleared" : "pending";
  if (!title || !creator || !lang || !Number.isFinite(durationS) || durationS < 1 || durationS > 24 * 60 * 60) {
    return NextResponse.json({ error: "Title, creator, language and a valid duration are required." }, { status: 400 });
  }
  const kind = input.kind === "youtube" ? "youtube" : "file";
  let src = input.src?.trim() ?? "";
  if (kind === "youtube") {
    const match = src.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
    if (!match) return NextResponse.json({ error: "Invalid YouTube link." }, { status: 400 });
    src = match[1];
  } else if (!src.startsWith("/media/") || src.includes("..")) {
    return NextResponse.json({ error: "The file must be in media/." }, { status: 400 });
  }
  const sql = db();
  const creatorId = await getCreatorId(creator, lang);
  const inserted = await sql`
    insert into items (kind, src, title, creator_id, duration_s, lang, rights, rights_note)
    values (${kind}, ${src}, ${title}, ${creatorId}, ${Math.ceil(durationS)}, ${lang}, ${rights}, ${input.rights_note?.trim() || null})
    returning id
  `;
  return NextResponse.json({ id: inserted[0].id }, { status: 201 });
}

export async function PATCH(request: Request) {
  if (!(await isStudioAuthenticated())) return NextResponse.json({ error: "Sign-in required." }, { status: 401 });
  let input: ItemInput & { id?: string };
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!input.id) return NextResponse.json({ error: "Id required." }, { status: 400 });
  const sql = db();
  const rows = await sql`
    update items set
      title = coalesce(${input.title?.trim() || null}, title),
      rights = coalesce(${input.rights === "cleared" || input.rights === "pending" || input.rights === "refused" ? input.rights : null}, rights),
      rights_note = coalesce(${input.rights_note?.trim() || null}, rights_note)
    where id = ${input.id} returning id
  `;
  if (!rows[0]) return NextResponse.json({ error: "Program not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
