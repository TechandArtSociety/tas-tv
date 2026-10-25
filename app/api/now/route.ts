import { NextResponse } from "next/server";
import { onAirSchedule } from "@/lib/onair";

export const dynamic = "force-dynamic";

export async function GET() {
  const now = new Date();
  try {
    const schedule = await onAirSchedule(now);
    return NextResponse.json({ serverNow: now.toISOString(), ...schedule }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("GET /api/now:", error);
    return NextResponse.json({ error: "The antenna is not answering yet." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
