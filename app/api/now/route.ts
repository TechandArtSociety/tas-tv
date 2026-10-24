import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fallback, fallbackSlots, locate, type PlaylistItem, type Slot } from "@/lib/locate";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  startsAt: Date;
  endsAt: Date;
  kind: "item" | "bumper";
  bumperText: string | null;
  itemId: string | null;
  src: string | null;
  title: string | null;
  durationS: number | null;
  itemKind: "file" | "youtube" | null;
  creatorName: string | null;
  channelUrl: string | null;
  lang: string | null;
};

function fromRow(row: Row): Slot {
  return {
    id: row.id,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    kind: row.kind,
    ...(row.itemId && row.title
      ? {
          item: {
            id: row.itemId,
            src: row.src ?? undefined,
            title: row.title,
            duration_s: Number(row.durationS ?? 1),
            kind: row.itemKind ?? "file",
            lang: row.lang,
            creator: { name: row.creatorName ?? "TAS", channel_url: row.channelUrl },
          } as PlaylistItem,
        }
      : {}),
  };
}

export async function GET() {
  const sql = db();
  const now = new Date();
  try {
    const rows = await sql<Row[]>`
      select s.id, s.starts_at as "startsAt", s.ends_at as "endsAt", s.kind,
             s.bumper_text as "bumperText", i.id as "itemId", i.src, i.title,
             i.duration_s as "durationS", i.kind as "itemKind", i.lang,
             c.name as "creatorName", c.channel_url as "channelUrl"
      from slots s
      join grids g on g.day = s.day
      left join items i on i.id = s.item_id
      left join creators c on c.id = i.creator_id
      where g.status = 'published' and s.ends_at > ${now}
      order by s.starts_at
      limit 4
    `;
    const slots = rows.map(fromRow);
    const current = locate(slots, now);
    const serverNow = now.toISOString();
    if (current) {
      return NextResponse.json({ serverNow, mode: "grid", current, slots }, { headers: { "Cache-Control": "no-store" } });
    }

    const items = await sql<PlaylistItem[]>`
      select i.id, i.src, i.title, i.duration_s, i.kind, i.lang,
             json_build_object('name', c.name, 'channel_url', c.channel_url) as creator
      from items i join creators c on c.id = i.creator_id
      where i.rights = 'cleared' and i.kind = 'file'
      order by i.created_at, i.id
    `;
    const fallbackCurrent = fallback(items, now);
    const fallbackSchedule = fallbackSlots(items, now, 4);
    return NextResponse.json({
      serverNow,
      mode: fallbackCurrent ? "fallback" : "waiting",
      current: fallbackCurrent,
      slots: fallbackSchedule,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("GET /api/now:", error);
    return NextResponse.json({ error: "L'antenne ne répond pas encore." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
