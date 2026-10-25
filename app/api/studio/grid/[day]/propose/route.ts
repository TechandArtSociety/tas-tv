import { existsSync } from "node:fs";
import { basename, extname, resolve } from "node:path";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isStudioAuthenticated } from "@/lib/auth";
import { proposeRotations } from "@/lib/kayo";
import { layoutDay, type Program } from "@/lib/schedule";

export const runtime = "nodejs";

type ProgramRow = Program & { src: string };

/** Kayo proposes a full day: rotations per daypart, his announcements, house ads. Saved as a draft for a human to publish. */
export async function POST(request: Request, { params }: { params: Promise<{ day: string }> }) {
  if (!(await isStudioAuthenticated())) return NextResponse.json({ error: "Sign-in required." }, { status: 401 });
  const { day } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !Number.isFinite(Date.parse(`${day}T12:00:00Z`))) return NextResponse.json({ error: "Invalid date." }, { status: 400 });

  const sql = db();
  const [current] = await sql<{ status: string }[]>`select status from grids where day = ${day}::date`;
  if (current?.status === "published" && new URL(request.url).searchParams.get("force") !== "1") {
    return NextResponse.json({ error: "This grid is on air. Confirm to replace it with a draft proposal.", published: true }, { status: 409 });
  }
  const rows = await sql<ProgramRow[]>`
    select i.id, i.title, i.src, c.name as creator, i.duration_s, i.lang, i.tags, i.mood, i.summary
    from items i join creators c on c.id = i.creator_id
    where i.rights = 'cleared' and i.kind = 'file'
    order by i.title
  `;
  const programs = rows.filter((row) => !row.tags.includes("pub"));
  const ads = rows.filter((row) => row.tags.includes("pub"));
  if (programs.length < 2) return NextResponse.json({ error: "At least two programs with cleared rights are needed." }, { status: 400 });
  const [settings] = await sql<{ ad_every_n_items: number }[]>`select ad_every_n_items from settings where id = 1`;

  const { rotations, source, note } = await proposeRotations(programs);
  const kayoDir = resolve(process.cwd(), "media", "kayo");
  const slots = layoutDay({
    day, rotations, programs, ads, adEvery: settings?.ad_every_n_items ?? 2,
    bumperAudio: (program) => {
      const src = (program as ProgramRow).src;
      const file = `${basename(src, extname(src))}.mp3`;
      return existsSync(resolve(kayoDir, file)) ? `/media/kayo/${file}` : null;
    },
  });

  try {
    await sql.begin(async (tx) => {
      await tx`insert into grids (day, status, proposal) values (${day}::date, 'draft', ${tx.json({ source, note: note ?? null, rotations, proposedAt: new Date().toISOString() })})
        on conflict (day) do update set status = 'draft', published_at = null, proposal = excluded.proposal`;
      await tx`delete from slots where day = ${day}::date`;
      const values = slots.map((slot) => ({
        day, starts_at: slot.startsAt, ends_at: slot.endsAt, kind: slot.kind, item_id: slot.itemId,
        bumper_text: slot.bumperText, bumper_audio: slot.bumperAudio, reason: slot.reason,
      }));
      for (let i = 0; i < values.length; i += 200) {
        await tx`insert into slots ${tx(values.slice(i, i + 200), "day", "starts_at", "ends_at", "kind", "item_id", "bumper_text", "bumper_audio", "reason")}`;
      }
    });
  } catch (error) {
    console.error("POST propose:", error);
    return NextResponse.json({ error: "The proposal could not be saved." }, { status: 409 });
  }
  return NextResponse.json({ source, note: note ?? null, rotations, slots: slots.length });
}
