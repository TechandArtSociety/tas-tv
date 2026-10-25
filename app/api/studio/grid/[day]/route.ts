import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isStudioAuthenticated } from "@/lib/auth";
import { parisDay } from "@/lib/paris";
import { BUMPER_S } from "@/lib/schedule";

export const runtime = "nodejs";

type SlotInput = { kind?: "item" | "bumper"; itemId?: string | null; startsAt?: string; bumperText?: string | null; bumperAudio?: string | null; reason?: string | null };
type RouteContext = { params: Promise<{ day: string }> };

function validDay(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T12:00:00Z`));
}

export async function GET(_request: Request, { params }: RouteContext) {
  if (!(await isStudioAuthenticated())) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const { day } = await params;
  if (!validDay(day)) return NextResponse.json({ error: "Date invalide." }, { status: 400 });
  const sql = db();
  const gridRows = await sql`select day, status, published_at, proposal from grids where day = ${day}::date`;
  const slots = await sql`
    select s.id, s.starts_at, s.ends_at, s.kind, s.bumper_text, s.bumper_audio, s.reason,
           i.id as item_id, coalesce(i.title, s.bumper_text) as title,
           coalesce(i.duration_s, extract(epoch from s.ends_at - s.starts_at)::int) as duration_s,
           coalesce(i.rights, 'cleared') as rights, i.src, i.kind as item_kind, i.lang, i.tags,
           coalesce(c.name, 'Kayo') as creator
    from slots s left join items i on i.id = s.item_id left join creators c on c.id = i.creator_id
    where s.day = ${day}::date
    order by s.starts_at
  `;
  return NextResponse.json({ grid: gridRows[0] ?? { day, status: "draft" }, slots });
}

export async function PUT(request: Request, { params }: RouteContext) {
  if (!(await isStudioAuthenticated())) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const { day } = await params;
  if (!validDay(day)) return NextResponse.json({ error: "Date invalide." }, { status: 400 });
  let input: { slots?: SlotInput[] };
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }
  if (!Array.isArray(input.slots) || input.slots.length > 2000) return NextResponse.json({ error: "La grille doit contenir une liste de créneaux." }, { status: 400 });

  const sql = db();
  const itemIds = [...new Set(input.slots.filter((slot) => slot.kind !== "bumper").map((slot) => slot.itemId).filter((id): id is string => Boolean(id)))];
  const items = new Map((await sql<{ id: string; duration_s: number; rights: string }[]>`
    select id, duration_s, rights from items where id = any(${itemIds}::uuid[])
  `).map((item) => [item.id, item]));

  const prepared: Array<{ kind: "item" | "bumper"; itemId: string | null; startsAt: Date; endsAt: Date; bumperText: string | null; bumperAudio: string | null; reason: string | null }> = [];
  for (const slot of input.slots) {
    const startsAt = new Date(slot.startsAt ?? "");
    if (!Number.isFinite(startsAt.getTime()) || parisDay(startsAt) !== day) {
      return NextResponse.json({ error: "L'heure du créneau doit être dans le jour choisi (heure de Paris)." }, { status: 400 });
    }
    const reason = slot.reason ? String(slot.reason).slice(0, 300) : null;
    if (slot.kind === "bumper") {
      const bumperText = String(slot.bumperText ?? "").slice(0, 200);
      const bumperAudio = slot.bumperAudio && /^\/media\/kayo\/[a-z0-9-]+\.mp3$/.test(slot.bumperAudio) ? slot.bumperAudio : null;
      if (!bumperText) return NextResponse.json({ error: "Une annonce de Kayo doit avoir un texte." }, { status: 400 });
      prepared.push({ kind: "bumper", itemId: null, startsAt, endsAt: new Date(startsAt.getTime() + BUMPER_S * 1000), bumperText, bumperAudio, reason });
      continue;
    }
    const item = slot.itemId ? items.get(slot.itemId) : undefined;
    if (!item) return NextResponse.json({ error: "Programme introuvable." }, { status: 400 });
    if (item.rights !== "cleared") return NextResponse.json({ error: "Un programme sans droits OK ne peut pas entrer à l'antenne." }, { status: 400 });
    const endsAt = new Date(startsAt.getTime() + Number(item.duration_s) * 1000);
    if (parisDay(new Date(endsAt.getTime() - 1)) !== day) return NextResponse.json({ error: "Un créneau ne peut pas dépasser minuit." }, { status: 400 });
    prepared.push({ kind: "item", itemId: item.id, startsAt, endsAt, bumperText: null, bumperAudio: null, reason });
  }
  prepared.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  for (let index = 1; index < prepared.length; index += 1) {
    if (prepared[index].startsAt < prepared[index - 1].endsAt) {
      return NextResponse.json({ error: "Deux créneaux se chevauchent." }, { status: 400 });
    }
  }

  try {
    await sql.begin(async (tx) => {
      await tx`insert into grids (day, status) values (${day}::date, 'draft')
        on conflict (day) do update set status = 'draft', published_at = null`;
      await tx`delete from slots where day = ${day}::date`;
      const values = prepared.map((slot) => ({
        day, starts_at: slot.startsAt, ends_at: slot.endsAt, kind: slot.kind, item_id: slot.itemId,
        bumper_text: slot.bumperText, bumper_audio: slot.bumperAudio, reason: slot.reason,
      }));
      for (let i = 0; i < values.length; i += 200) {
        await tx`insert into slots ${tx(values.slice(i, i + 200), "day", "starts_at", "ends_at", "kind", "item_id", "bumper_text", "bumper_audio", "reason")}`;
      }
    });
  } catch (error) {
    console.error("PUT studio grid:", error);
    return NextResponse.json({ error: "La grille n'a pas pu être enregistrée." }, { status: 409 });
  }
  return NextResponse.json({ ok: true, saved: prepared.filter((slot) => slot.kind === "item").length });
}
