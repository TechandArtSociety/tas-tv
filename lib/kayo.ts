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
  if (!hasOpenAI()) return { rotations: rules, source: "règles", note: "Pas de clé OpenAI : proposition par règles (tags et ambiances des fiches)." };
  try {
    const answer = await respond<{ dayparts: Array<{ name: DaypartName; item_ids: string[]; reason: string }> }>({
      step: "grid_proposal",
      promptVersion: "grid-v1",
      maxOutputTokens: 8000, // reasoning models count their thinking in this budget
      schema: ROTATION_SCHEMA,
      instructions: [
        "Tu es Kayo, co-programmateur de TAS TV, une chaîne 24/7 de créateurs indépendants (Tech & Art Society, Paris).",
        "Pour chacune des quatre tranches (nuit 0-7 h, matin 7-12 h, après-midi 12-19 h, soirée 19-24 h), donne l'ordre de passage des programmes : au moins deux identifiants par tranche, pris uniquement dans la liste fournie.",
        "Évite deux programmes du même créateur à la suite. Accorde l'ambiance à l'heure.",
        "Pour chaque tranche, une raison de 20 mots au plus, fondée uniquement sur les fiches, en français. Un humain relira et publiera.",
      ].join(" "),
      input: JSON.stringify(programs.map(({ id, title, creator, duration_s, lang, tags, mood, summary }) => ({ id, title, creator, duration_s, lang, tags, mood, summary }))),
    });
    const known = new Set(programs.map((program) => program.id));
    const rotations = { ...rules };
    for (const part of answer.dayparts) {
      const ids = part.item_ids.filter((id) => known.has(id));
      if (ids.length >= 2 && part.name in rotations) rotations[part.name] = { itemIds: ids, reason: `Kayo : ${part.reason}` };
    }
    return { rotations, source: "openai" };
  } catch (error) {
    console.error("Kayo proposal:", error);
    return { rotations: rules, source: "règles", note: "OpenAI n'a pas répondu : proposition par règles." };
  }
}

export type OnAir = { title: string; creator: string; summary: string | null } | null;

/** Kayo's answer to "@kayo …" in the chat, grounded only in the card of the program on air. */
export async function kayoAnswer(question: string, onAir: OnAir): Promise<string> {
  if (!onAir) return "Rien à l'antenne pour le moment : la grille reprend bientôt.";
  const card = `À l'antenne : « ${onAir.title} », ${onAir.creator}.${onAir.summary ? ` ${onAir.summary}` : ""}`;
  if (!hasOpenAI()) return card;
  try {
    const text = await respond<string>({
      step: "chat_answer",
      promptVersion: "chat-v1",
      maxOutputTokens: 1500,
      instructions: "Tu es Kayo, le présentateur IA de TAS TV. Réponds en 40 mots au plus, dans la langue de la question, uniquement à partir de la fiche du programme. Si la fiche ne contient pas la réponse, dis-le simplement. Aucun chiffre ni fait inventé.",
      input: `Fiche du programme : ${card}\n\nQuestion du spectateur : ${question}`,
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
