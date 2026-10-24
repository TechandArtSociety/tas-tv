import { describe, expect, it } from "vitest";
import { fallback, locate, type Slot } from "../lib/locate";

const item = { id: "one", title: "Premier", duration_s: 60 };
const second = { id: "two", title: "Deuxième", duration_s: 40 };

function slot(id: string, startsAt: string, endsAt: string, selected = item): Slot {
  return { id, startsAt, endsAt, item: selected };
}

describe("locate", () => {
  it("returns the current slot and its offset", () => {
    const result = locate([slot("a", "2026-10-24T10:00:00Z", "2026-10-24T10:01:00Z")], "2026-10-24T10:00:24Z");
    expect(result?.slot.id).toBe("a");
    expect(result?.offsetS).toBe(24);
  });

  it("selects the next slot exactly at a boundary", () => {
    const slots = [
      slot("a", "2026-10-24T10:00:00Z", "2026-10-24T10:01:00Z"),
      slot("b", "2026-10-24T10:01:00Z", "2026-10-24T10:02:00Z", second),
    ];
    expect(locate(slots, "2026-10-24T10:01:00Z")?.slot.id).toBe("b");
  });

  it("uses the fallback for a gap in the grid", () => {
    const now = "2026-10-24T10:04:00Z";
    expect(locate([slot("a", "2026-10-24T10:00:00Z", "2026-10-24T10:01:00Z")], now)).toBeNull();
    expect(fallback([item], now)?.slot.item.id).toBe("one");
  });

  it("covers the 25-hour Paris day on the winter clock change", () => {
    const parisMidnight = Date.parse("2026-10-24T22:00:00Z");
    const nextParisMidnight = Date.parse("2026-10-25T23:00:00Z");
    expect(nextParisMidnight - parisMidnight).toBe(25 * 60 * 60 * 1000);
    const wholeDay = slot("dst", new Date(parisMidnight).toISOString(), new Date(nextParisMidnight).toISOString());
    expect(locate([wholeDay], "2026-10-25T22:30:00Z")?.offsetS).toBe(24.5 * 60 * 60);
  });

  it("returns no fallback when the library has no cleared item", () => {
    expect(fallback([], Date.now())).toBeNull();
  });
});
