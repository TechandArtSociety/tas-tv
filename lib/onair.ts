import { db } from "./db";
import { fallback, fallbackSlots, locate, type PlaylistItem, type Slot } from "./locate";

type Row = {
  id: string; startsAt: Date; endsAt: Date; kind: "item" | "bumper";
  bumperText: string | null; bumperAudio: string | null;
  itemId: string | null; src: string | null; title: string | null; durationS: number | null;
  itemKind: "file" | "youtube" | null; lang: string | null; tags: string[] | null; summary: string | null;
  creatorName: string | null; channelUrl: string | null;
};

function fromRow(row: Row): Slot {
  return {
    id: row.id, startsAt: row.startsAt, endsAt: row.endsAt, kind: row.kind,
    bumperText: row.bumperText, bumperAudio: row.bumperAudio,
    ...(row.itemId && row.title ? {
      item: {
        id: row.itemId, src: row.src ?? undefined, title: row.title, duration_s: Number(row.durationS ?? 1),
        kind: row.itemKind ?? "file", lang: row.lang ?? undefined, tags: row.tags ?? [], summary: row.summary,
        creator: { name: row.creatorName ?? "TAS", channel_url: row.channelUrl },
      } as PlaylistItem,
    } : {}),
  };
}

/** What is on air now (published grid first, then the fallback loop) and what follows. */
export async function onAirSchedule(now: Date, limit = 8) {
  const sql = db();
  const rows = await sql<Row[]>`
    select s.id, s.starts_at as "startsAt", s.ends_at as "endsAt", s.kind,
           s.bumper_text as "bumperText", s.bumper_audio as "bumperAudio",
           i.id as "itemId", i.src, i.title, i.duration_s as "durationS", i.kind as "itemKind", i.lang, i.tags, i.summary,
           c.name as "creatorName", c.channel_url as "channelUrl"
    from slots s
    join grids g on g.day = s.day
    left join items i on i.id = s.item_id
    left join creators c on c.id = i.creator_id
    where g.status = 'published' and s.ends_at > ${now}
    order by s.starts_at
    limit ${limit}
  `;
  const slots = rows.map(fromRow);
  const current = locate(slots, now);
  if (current) return { mode: "grid" as const, current, slots };

  const items = await sql<PlaylistItem[]>`
    select i.id, i.src, i.title, i.duration_s, i.kind, i.lang, i.tags, i.summary,
           json_build_object('name', c.name, 'channel_url', c.channel_url) as creator
    from items i join creators c on c.id = i.creator_id
    where i.rights = 'cleared' and i.kind = 'file' and not ('pub' = any(i.tags))
    order by i.created_at, i.id
  `;
  const loop = fallback(items, now);
  return { mode: loop ? ("fallback" as const) : ("waiting" as const), current: loop, slots: fallbackSlots(items, now, 4) };
}

/** The program a viewer is watching: during a Kayo announcement, the program it announces. */
export async function onAirProgram(now: Date) {
  const { current, slots } = await onAirSchedule(now);
  if (!current) return null;
  const item = current.slot.item ?? slots.find((slot) => slot.item && new Date(slot.startsAt) >= new Date(current.slot.endsAt))?.item;
  return item ? { title: item.title, creator: item.creator?.name ?? "TAS", summary: item.summary ?? null } : null;
}
