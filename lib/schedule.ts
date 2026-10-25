import { nextDay, parisHour, parisMidnight } from "./paris";

export type Program = {
  id: string;
  title: string;
  creator: string;
  duration_s: number;
  lang: string;
  tags: string[];
  mood: string | null;
  summary: string | null;
};

export const DAYPARTS = [
  { name: "nuit", from: 0, to: 7, label: "Nuit", likes: ["ambiance", "nuit", "planant", "hypnotique", "art", "contemplatif"] },
  { name: "matin", from: 7, to: 12, label: "Matin", likes: ["musique", "archives", "chaleureux", "photo", "kayo", "film"] },
  { name: "apres-midi", from: 12, to: 19, label: "Après-midi", likes: ["tech", "task", "démo", "pédagogique", "archives", "film"] },
  { name: "soiree", from: 19, to: 24, label: "Soirée", likes: ["film", "live", "événement", "épique", "énergique", "art", "musique"] },
] as const;

export type DaypartName = (typeof DAYPARTS)[number]["name"];
export type Rotation = { itemIds: string[]; reason: string };
export type Rotations = Record<DaypartName, Rotation>;

export type PlannedSlot = {
  kind: "item" | "bumper";
  itemId: string | null;
  startsAt: Date;
  endsAt: Date;
  bumperText: string | null;
  bumperAudio: string | null;
  reason: string | null;
};

export const BUMPER_S = 8;

function daypartAt(date: Date): DaypartName {
  const hour = parisHour(date);
  return DAYPARTS.find((part) => hour >= part.from && hour < part.to)!.name;
}

/** Orders programs so the same creator never plays twice in a row when another creator is available. */
function interleave(programs: Program[]): Program[] {
  const queue = [...programs];
  const out: Program[] = [];
  while (queue.length) {
    const index = queue.findIndex((program) => program.creator !== out.at(-1)?.creator);
    out.push(...queue.splice(index === -1 ? 0 : index, 1));
  }
  return out;
}

/** Kayo's rule-based proposal: for each daypart, the programs whose tags or mood fit it. Used when no OpenAI key is set. */
export function rulesRotations(programs: Program[]): Rotations {
  const result = {} as Rotations;
  for (const part of DAYPARTS) {
    const likes: readonly string[] = part.likes;
    const scored = programs
      .map((program) => ({ program, score: [...program.tags, program.mood ?? ""].filter((tag) => likes.includes(tag)).length }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score || a.program.title.localeCompare(b.program.title));
    const chosen = scored.length >= 2 ? scored.map((entry) => entry.program) : programs;
    result[part.name] = {
      itemIds: interleave(chosen).map((program) => program.id),
      reason: `${part.label} : ${likes.slice(0, 3).join(", ")}, d'après les fiches des programmes.`,
    };
  }
  return result;
}

/**
 * Lays one Paris day out back to back: a Kayo announcement before each program, a house ad every `adEvery` programs.
 * Stops at the last program that fits before midnight; the gap left is covered by the fallback loop.
 */
export function layoutDay(options: {
  day: string;
  rotations: Rotations;
  programs: Program[];
  ads: Program[];
  adEvery: number;
  bumperAudio?: (program: Program) => string | null;
}): PlannedSlot[] {
  const byId = new Map(options.programs.map((program) => [program.id, program]));
  const start = parisMidnight(options.day).getTime();
  const end = parisMidnight(nextDay(options.day)).getTime();
  const lastPlayed = new Map<string, number>();
  const slots: PlannedSlot[] = [];
  let cursor = start;
  let previousCreator: string | null = null;
  let sinceAd = 0;
  let adIndex = 0;

  while (cursor < end) {
    const part = daypartAt(new Date(cursor));
    const rotation = options.rotations[part].itemIds.map((id) => byId.get(id)).filter((program): program is Program => Boolean(program));
    if (rotation.length === 0) break;
    // the least recently played program of this daypart, by another creator than the previous one when possible
    const pool = rotation.some((candidate) => candidate.creator !== previousCreator) ? rotation.filter((candidate) => candidate.creator !== previousCreator) : rotation;
    const program = pool.reduce((best, candidate) => ((lastPlayed.get(candidate.id) ?? -1) < (lastPlayed.get(best.id) ?? -1) ? candidate : best));
    lastPlayed.set(program.id, slots.length);

    const programEnd = cursor + (BUMPER_S + program.duration_s) * 1000;
    if (programEnd > end) break;
    slots.push({
      kind: "bumper", itemId: null, startsAt: new Date(cursor), endsAt: new Date(cursor + BUMPER_S * 1000),
      bumperText: `Up next on TAS TV: ${program.title}, by ${program.creator}.`,
      bumperAudio: options.bumperAudio?.(program) ?? null, reason: null,
    });
    slots.push({
      kind: "item", itemId: program.id, startsAt: new Date(cursor + BUMPER_S * 1000), endsAt: new Date(programEnd),
      bumperText: null, bumperAudio: null, reason: options.rotations[part].reason,
    });
    cursor = programEnd;
    previousCreator = program.creator;
    sinceAd += 1;

    if (options.adEvery > 0 && sinceAd >= options.adEvery && options.ads.length) {
      const ad = options.ads[adIndex % options.ads.length];
      if (cursor + ad.duration_s * 1000 > end) break;
      slots.push({
        kind: "item", itemId: ad.id, startsAt: new Date(cursor), endsAt: new Date(cursor + ad.duration_s * 1000),
        bumperText: null, bumperAudio: null, reason: "Pub maison TAS.",
      });
      cursor += ad.duration_s * 1000;
      adIndex += 1;
      sinceAd = 0;
    }
  }
  return slots;
}
