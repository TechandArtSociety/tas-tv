import { createHmac, createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "tas_tv_studio";
const SESSION_SECONDS = 60 * 60 * 12;

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value) throw new Error("SESSION_SECRET est manquant.");
  return value;
}

function signature(expires: string) {
  return createHmac("sha256", secret()).update(expires).digest("hex");
}

export function passwordMatches(candidate: string, configured: string) {
  return timingSafeEqual(createHash("sha256").update(candidate).digest(), createHash("sha256").update(configured).digest());
}

export async function createStudioSession() {
  const expires = String(Math.floor(Date.now() / 1000) + SESSION_SECONDS);
  const store = await cookies();
  store.set(COOKIE_NAME, `${expires}.${signature(expires)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
}

export async function clearStudioSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function isStudioAuthenticated() {
  const value = (await cookies()).get(COOKIE_NAME)?.value;
  if (!value) return false;
  const [expires, received] = value.split(".");
  if (!expires || !received || Number(expires) <= Math.floor(Date.now() / 1000)) return false;
  const expected = signature(expires);
  const actualBytes = Buffer.from(received, "hex");
  const expectedBytes = Buffer.from(expected, "hex");
  return actualBytes.length === expectedBytes.length && timingSafeEqual(actualBytes, expectedBytes);
}
