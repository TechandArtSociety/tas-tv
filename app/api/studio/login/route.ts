import { NextResponse } from "next/server";
import { createStudioSession, passwordMatches } from "@/lib/auth";

export async function POST(request: Request) {
  const configured = process.env.STUDIO_PASSWORD;
  if (!configured) return NextResponse.json({ error: "STUDIO_PASSWORD is missing." }, { status: 503 });
  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (typeof body.password !== "string" || !passwordMatches(body.password, configured)) {
    return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  }
  await createStudioSession();
  return NextResponse.json({ ok: true });
}
