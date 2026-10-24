export type PlaylistItem = {
  id: string;
  title: string;
  duration_s: number;
  lang?: string;
  creator?: { name: string; channel_url?: string | null };
  src?: string;
  kind?: "file" | "youtube";
};

export type Slot = {
  id: string;
  startsAt: string | Date;
  endsAt: string | Date;
  item?: PlaylistItem;
  kind?: "item" | "bumper";
};

type LoopSlot = Slot & { item: PlaylistItem };

function milliseconds(value: number | Date | string): number {
  return value instanceof Date ? value.getTime() : typeof value === "number" ? value : Date.parse(value);
}

export function locate<T extends Slot>(slots: T[], now: number | Date | string): { slot: T; offsetS: number } | null {
  const nowMs = milliseconds(now);
  const slot = slots.find((candidate) => milliseconds(candidate.startsAt) <= nowMs && nowMs < milliseconds(candidate.endsAt));
  if (!slot) return null;
  return { slot, offsetS: Math.max(0, (nowMs - milliseconds(slot.startsAt)) / 1000) };
}

export function fallback(items: PlaylistItem[], now: number | Date | string): { slot: LoopSlot; offsetS: number } | null {
  if (items.length === 0) return null;
  const totalS = items.reduce((total, item) => total + Math.max(1, item.duration_s), 0);
  const nowMs = milliseconds(now);
  let positionS = ((nowMs / 1000) % totalS + totalS) % totalS;
  let index = 0;
  while (index < items.length - 1 && positionS >= Math.max(1, items[index].duration_s)) {
    positionS -= Math.max(1, items[index].duration_s);
    index += 1;
  }
  const item = items[index];
  const offsetS = positionS;
  const startsMs = nowMs - offsetS * 1000;
  const durationS = Math.max(1, item.duration_s);
  return {
    slot: {
      id: `fallback:${item.id}:${Math.floor(startsMs / 1000)}`,
      startsAt: new Date(startsMs),
      endsAt: new Date(startsMs + durationS * 1000),
      item,
      kind: "item",
    },
    offsetS,
  };
}

export function fallbackSlots(items: PlaylistItem[], now: number | Date | string, count = 4): Slot[] {
  const current = fallback(items, now);
  if (!current) return [];
  const slots = [current.slot];
  const startMs = milliseconds(current.slot.endsAt);
  let cursorMs = startMs;
  const currentIndex = items.findIndex((item) => item.id === current.slot.item.id);
  for (let step = 1; step < count; step += 1) {
    const item = items[(currentIndex + step) % items.length];
    const durationS = Math.max(1, item.duration_s);
    slots.push({
      id: `fallback:${item.id}:${Math.floor(cursorMs / 1000)}`,
      startsAt: new Date(cursorMs),
      endsAt: new Date(cursorMs + durationS * 1000),
      item,
      kind: "item",
    });
    cursorMs += durationS * 1000;
  }
  return slots;
}
