import { NextResponse } from "next/server";
import { clearStudioSession } from "@/lib/auth";

export async function POST() {
  await clearStudioSession();
  return NextResponse.json({ ok: true });
}
