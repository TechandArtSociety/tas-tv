import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAllowedMessage, kayoAnswer } from "@/lib/kayo";
import { onAirProgram } from "@/lib/onair";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ponytail: in-memory rate limit (one process); move to the database if TAS TV runs on several servers.
const lastPost = new Map<string, number>();
const lastKayo = { at: 0 };

function clean(value: unknown, max: number) {
  return Array.from(String(value ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim()).slice(0, max).join("");
}

// The right-most X-Forwarded-For hop is the one our proxy added; the left-most is whatever the client sent.
function clientIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() || "local";
}

export async function GET(request: Request) {
  const raw = Number(new URL(request.url).searchParams.get("after") ?? 0);
  const after = Number.isSafeInteger(raw) && raw > 0 ? raw : 0;
  const rows = await db()`
    select id, nick, body, by_kayo as "byKayo", created_at as "createdAt"
    from chat_messages where not hidden and id > ${after}
    order by id desc limit 50
  `;
  return NextResponse.json({ messages: rows.reverse() }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const ip = clientIp(request);
  const now = Date.now();
  if (lastPost.size > 5000) for (const [key, at] of lastPost) if (now - at > 5000) lastPost.delete(key);
  if (now - (lastPost.get(ip) ?? 0) < 5000) return NextResponse.json({ error: "One message every 5 seconds, please." }, { status: 429 });

  let input: { nick?: string; body?: string };
  try {
    input = (await request.json()) ?? {};
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const nick = clean(input.nick, 24);
  const body = clean(input.body, 300);
  if (Array.from(nick).length < 2) return NextResponse.json({ error: "Pick a nickname of at least 2 characters." }, { status: 400 });
  if (!body) return NextResponse.json({ error: "The message is empty." }, { status: 400 });
  if (/^kayo$/i.test(nick)) return NextResponse.json({ error: "This nickname is reserved." }, { status: 400 });
  lastPost.set(ip, now);

  const verdict = await isAllowedMessage(`${nick}: ${body}`);
  if (!verdict.allowed) return NextResponse.json({ error: "Message blocked by moderation.", moderation: verdict.by }, { status: 422 });

  const sql = db();
  const [message] = await sql`insert into chat_messages (nick, body) values (${nick}, ${body}) returning id`;

  if (/@kayo\b/i.test(body) && now - lastKayo.at > 3000) {
    lastKayo.at = now;
    const onAir = await onAirProgram(new Date());
    let answer = await kayoAnswer(body.replace(/@kayo\b/gi, "").trim(), onAir);
    // R-11 applies to Kayo too: a flagged answer is replaced by the bare program card
    if (!(await isAllowedMessage(answer)).allowed) answer = onAir ? `On air: "${onAir.title}", by ${onAir.creator}.` : "Nothing on air right now.";
    await sql`insert into chat_messages (nick, body, by_kayo) values ('Kayo', ${clean(answer, 300)}, true)`;
  }
  return NextResponse.json({ id: message.id, moderation: verdict.by });
}
