import { describe, expect, it } from "vitest";
import { nextDay, parisMidnight } from "../lib/paris";
import { layoutDay, rulesRotations, type Program } from "../lib/schedule";

const program = (id: string, creator: string, duration_s: number, tags: string[], mood: string | null = null): Program =>
  ({ id, title: id, creator, duration_s, lang: "en", tags, mood, summary: null });

const programs = [
  program("ooo", "TAS", 223, ["art", "live"], "hypnotic"),
  program("ooo-lent", "TAS", 447, ["art", "night"], "dreamy"),
  program("lddmp", "LDDMP", 182, ["music", "archives"], "warm"),
  program("sunday", "Third Eye Shot", 60, ["music", "live"], "energetic"),
  program("task", "TAS", 285, ["tech", "task"], "educational"),
  program("film", "TAS Studio", 212, ["film"], "contemplative"),
];
const ads = [program("mag", "TAS", 30, ["pub"])];

describe("layoutDay", () => {
  it("fills the 25-hour day of 25/10 back to back, inside the day, with bumpers and ads", () => {
    const day = "2026-10-25";
    const slots = layoutDay({ day, rotations: rulesRotations(programs), programs, ads, adEvery: 2 });
    const start = parisMidnight(day).getTime();
    const end = parisMidnight(nextDay(day)).getTime();
    expect(end - start).toBe(25 * 3600 * 1000);
    expect(slots[0].startsAt.getTime()).toBe(start);
    expect(slots.at(-1)!.endsAt.getTime()).toBeLessThanOrEqual(end);
    for (let i = 1; i < slots.length; i += 1) expect(slots[i].startsAt.getTime()).toBe(slots[i - 1].endsAt.getTime());
    // every program is announced by a Kayo bumper
    slots.forEach((slot, i) => {
      if (slot.kind === "item" && slot.itemId !== "mag") expect(slots[i - 1].kind).toBe("bumper");
    });
    // a house ad after every two programs
    const sequence = slots.filter((slot) => slot.kind === "item").map((slot) => slot.itemId);
    expect(sequence.slice(0, 6)).toEqual([sequence[0], sequence[1], "mag", sequence[3], sequence[4], "mag"]);
    // the same creator never twice in a row when another one is available
    const creators = sequence.filter((id) => id !== "mag").map((id) => programs.find((p) => p.id === id)!.creator);
    const repeats = creators.filter((creator, i) => i > 0 && creator === creators[i - 1]).length;
    expect(repeats).toBe(0);
  });

  it("puts night programs at night", () => {
    const rotations = rulesRotations(programs);
    expect(rotations.nuit.itemIds).toContain("ooo-lent");
    expect(rotations.nuit.itemIds).not.toContain("task");
  });
});
