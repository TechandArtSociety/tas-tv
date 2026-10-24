import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isStudioAuthenticated } from "@/lib/auth";

export const runtime = "nodejs";

type SlotInput = { itemId?: string; startsAt?: string };
type RouteContext = { params: Promise<{ day: string }> };

function validDay(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T12:00:00Z`));
}

function parisDay(value: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);
  const part = (name: string) => parts.find((candidate) => candidate.type === name)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export async function GET(_request: Request, { params }: RouteContext) {
  if (!(await isStudioAuthenticated())) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const { day } = await params;
  if (!validDay(day)) return NextResponse.json({ error: "Date invalide." }, { status: 400 });
  const sql = db();
  const gridRows = await sql`select day, status, published_at from grids where day = ${day}::date`;
  const slots = await sql`
    select s.id, s.starts_at, s.ends_at, i.id as item_id, i.title, i.duration_s, i.rights,
           i.src, i.kind, i.lang, c.name as creator
    from slots s join items i on i.id = s.item_id join creators c on c.id = i.creator_id
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
  if (!Array.isArray(input.slots)) return NextResponse.json({ error: "La grille doit contenir une liste de créneaux." }, { status: 400 });

  const sql = db();
  const prepared: Array<{ itemId: string; startsAt: Date; endsAt: Date }> = [];
  for (const slot of input.slots) {
    if (!slot.itemId || !slot.startsAt) return NextResponse.json({ error: "Chaque créneau doit avoir un programme et une heure." }, { status: 400 });
    const startsAt = new Date(slot.startsAt);
    if (!Number.isFinite(startsAt.getTime()) || parisDay(startsAt) !== day) {
      return NextResponse.json({ error: "L'heure du créneau doit être dans le jour choisi (heure de Paris)." }, { status: 400 });
    }
    const item = await sql`select duration_s, rights from items where id = ${slot.itemId}`;
    if (!item[0]) return NextResponse.json({ error: "Programme introuvable." }, { status: 400 });
    if (item[0].rights !== "cleared") return NextResponse.json({ error: "Un programme sans droits OK ne peut pas entrer à l'antenne." }, { status: 400 });
    const endsAt = new Date(startsAt.getTime() + Number(item[0].duration_s) * 1000);
    if (parisDay(endsAt) !== day) return NextResponse.json({ error: "Un créneau ne peut pas dépasser minuit." }, { status: 400 });
    prepared.push({ itemId: slot.itemId, startsAt, endsAt });
  }
  prepared.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  for (let index = 1; index < prepared.length; index += 1) {
    if (prepared[index].startsAt < prepared[index - 1].endsAt) {
      return NextResponse.json({ error: "Deux programmes se chevauchent." }, { status: 400 });
    }
  }

  try {
    await sql.begin(async (tx) => {
      await tx`insert into grids (day, status) values (${day}::date, 'draft')
        on conflict (day) do update set status = 'draft', published_at = null`;
      await tx`delete from slots where day = ${day}::date`;
      for (const slot of prepared) {
        await tx`insert into slots (day, starts_at, ends_at, kind, item_id)
          values (${day}::date, ${slot.startsAt}, ${slot.endsAt}, 'item', ${slot.itemId})`;
      }
    });
  } catch (error) {
    console.error("PUT studio grid:", error);
    return NextResponse.json({ error: "La grille n'a pas pu être enregistrée." }, { status: 409 });
  }
  return NextResponse.json({ ok: true, saved: prepared.length });
}
