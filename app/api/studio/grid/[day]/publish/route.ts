import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isStudioAuthenticated } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(_request: Request, { params }: { params: Promise<{ day: string }> }) {
  if (!(await isStudioAuthenticated())) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const { day } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return NextResponse.json({ error: "Date invalide." }, { status: 400 });
  const sql = db();
  const count = await sql`select count(*)::int as count from slots where day = ${day}::date`;
  if (count[0].count === 0) return NextResponse.json({ error: "Ajoute au moins un programme avant de publier." }, { status: 400 });
  const invalid = await sql`
    select count(*)::int as count from slots s join items i on i.id = s.item_id
    where s.day = ${day}::date and i.rights <> 'cleared'
  `;
  if (invalid[0].count > 0) return NextResponse.json({ error: "La grille contient un programme sans droits OK." }, { status: 400 });
  const published = await sql`
    update grids set status = 'published', published_at = now()
    where day = ${day}::date returning day, status, published_at
  `;
  if (!published[0]) return NextResponse.json({ error: "Grille introuvable." }, { status: 404 });
  return NextResponse.json({ grid: published[0] });
}
