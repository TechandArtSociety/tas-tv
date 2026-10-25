import { flaggedByOpenAI, hasOpenAI, respond } from "./openai";
import { DAYPARTS, rulesRotations, type DaypartName, type Program, type Rotations } from "./schedule";

export type KayoSource = "openai" | "règles";

const ROTATION_SCHEMA = {
  name: "tas_tv_rotations",
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["dayparts"],
    properties: {
      dayparts: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["name", "item_ids", "reason"],
          properties: {
            name: { type: "string", enum: DAYPARTS.map((part) => part.name) },
            item_ids: { type: "array", items: { type: "string" } },
            reason: { type: "string" },
          },
        },
      },
    },
  },
};

/** Kayo proposes the order of programs for each daypart. A human reviews and publishes; Kayo never publishes. */
export async function proposeRotations(programs: Program[]): Promise<{ rotations: Rotations; source: KayoSource; note?: string }> {
  const rules = rulesRotations(programs);
  if (!hasOpenAI()) return { rotations: rules, source: "règles", note: "No OpenAI key: proposal from local rules (tags and moods of the cards)." };
  try {
    const answer = await respond<{ dayparts: Array<{ name: DaypartName; item_ids: string[]; reason: string }> }>({
      step: "grid_proposal",
      promptVersion: "grid-v1",
      maxOutputTokens: 8000, // reasoning models count their thinking in this budget
      schema: ROTATION_SCHEMA,
      instructions: [
        "You are Kayo, co-programmer of TAS TV, a 24/7 channel of independent creators (Tech & Art Society, Paris).",
        "For each of the four dayparts (night 0-7, morning 7-12, afternoon 12-19, evening 19-24, Paris time), give the running order of programs: at least two ids per daypart, taken only from the list provided.",
        "Avoid two programs by the same creator in a row. Match the mood to the hour.",
        "For each daypart, one reason of 20 words at most, based only on the cards, in English. A human will review and publish.",
      ].join(" "),
      input: JSON.stringify(programs.map(({ id, title, creator, duration_s, lang, tags, mood, summary }) => ({ id, title, creator, duration_s, lang, tags, mood, summary }))),
    });
    const known = new Set(programs.map((program) => program.id));
    const rotations = { ...rules };
    for (const part of answer.dayparts) {
      const ids = part.item_ids.filter((id) => known.has(id));
      if (ids.length >= 2 && part.name in rotations) rotations[part.name] = { itemIds: ids, reason: `Kayo: ${part.reason}` };
    }
    return { rotations, source: "openai" };
  } catch (error) {
    console.error("Kayo proposal:", error);
    return { rotations: rules, source: "règles", note: "OpenAI did not answer: proposal from local rules." };
  }
}

export type OnAir = { title: string; creator: string; summary: string | null } | null;

/** Kayo's answer to "@kayo …" in the chat, grounded only in the card of the program on air. */
export async function kayoAnswer(question: string, onAir: OnAir): Promise<string> {
  if (!onAir) return "Nothing on air right now: the grid resumes soon.";
  const card = `On air: "${onAir.title}", by ${onAir.creator}.${onAir.summary ? ` ${onAir.summary}` : ""}`;
  if (!hasOpenAI()) return card;
  try {
    const text = await respond<string>({
      step: "chat_answer",
      promptVersion: "chat-v1",
      maxOutputTokens: 1500,
      instructions: "You are Kayo, the AI host of TAS TV. Answer in 40 words at most, in the language of the question, using only the program card. If the card does not hold the answer, say so plainly. Never invent a number or a fact.",
      input: `Program card: ${card}\n\nViewer question: ${question}`,
    });
    return text.trim().slice(0, 300) || card;
  } catch {
    return card;
  }
}

// ponytail: tiny local word list used only without an OpenAI key; OpenAI Moderation replaces it as soon as the key is set.
const LOCAL_BLOCKLIST = /\b(connard|connasse|salope|pute|encul[ée]e?|n[èe]gre|negro|nigg(?:a|er)|bougnoule|youpin|fdp|ntm|fuck\s+you|cunt|faggot|retard)\b/i;

export async function isAllowedMessage(text: string): Promise<{ allowed: boolean; by: "openai" | "liste locale" }> {
  if (hasOpenAI()) {
    try {
      return { allowed: !(await flaggedByOpenAI(text)), by: "openai" };
    } catch (error) {
      console.error("Moderation:", error);
    }
  }
  return { allowed: !LOCAL_BLOCKLIST.test(text), by: "liste locale" };
}
