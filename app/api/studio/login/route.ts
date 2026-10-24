import { NextResponse } from "next/server";
import { createStudioSession, passwordMatches } from "@/lib/auth";

export async function POST(request: Request) {
  const configured = process.env.STUDIO_PASSWORD;
  if (!configured) return NextResponse.json({ error: "STUDIO_PASSWORD est manquant." }, { status: 503 });
  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }
  if (typeof body.password !== "string" || !passwordMatches(body.password, configured)) {
    return NextResponse.json({ error: "Mot de passe incorrect." }, { status: 401 });
  }
  await createStudioSession();
  return NextResponse.json({ ok: true });
}
