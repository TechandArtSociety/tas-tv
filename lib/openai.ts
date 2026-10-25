import { createHash } from "node:crypto";
import { db } from "./db";

// Plain fetch on the OpenAI REST API: Responses (with Structured Outputs) and Moderation. No key, no call.
const API = "https://api.openai.com/v1";

export const hasOpenAI = () => Boolean(process.env.OPENAI_API_KEY);
export const textModel = () => process.env.OPENAI_MODEL || "gpt-5-mini";

async function post(path: string, body: unknown) {
  const response = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(45_000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`OpenAI ${response.status}: ${JSON.stringify(data).slice(0, 300)}`);
  return data;
}

type ResponseOutput = { output?: Array<{ type: string; content?: Array<{ type: string; text?: string }> }>; usage?: { input_tokens?: number; output_tokens?: number } };

function outputText(data: ResponseOutput) {
  return (data.output ?? []).flatMap((item) => item.content ?? []).filter((part) => part.type === "output_text").map((part) => part.text ?? "").join("");
}

async function logRun(run: { step: string; model: string; promptVersion: string; input: string; usage?: ResponseOutput["usage"]; ok: boolean; error?: string }) {
  try {
    await db()`insert into ai_runs (step, model, prompt_version, input_hash, tokens_in, tokens_out, ok, error)
      values (${run.step}, ${run.model}, ${run.promptVersion}, ${createHash("sha256").update(run.input).digest("hex")},
              ${run.usage?.input_tokens ?? null}, ${run.usage?.output_tokens ?? null}, ${run.ok}, ${run.error ?? null})`;
  } catch (error) {
    console.error("ai_runs:", error);
  }
}

/** One Responses API call. With `schema`, the answer is forced to that JSON shape (Structured Outputs). */
export async function respond<T = string>(options: {
  step: string; promptVersion: string; instructions: string; input: string; maxOutputTokens: number;
  schema?: { name: string; schema: Record<string, unknown> };
}): Promise<T> {
  const model = textModel();
  try {
    const data = (await post("/responses", {
      model,
      instructions: options.instructions,
      input: options.input,
      max_output_tokens: options.maxOutputTokens,
      store: false,
      ...(options.schema ? { text: { format: { type: "json_schema", name: options.schema.name, schema: options.schema.schema, strict: true } } } : {}),
    })) as ResponseOutput;
    const text = outputText(data);
    if (!text) throw new Error("réponse vide");
    await logRun({ step: options.step, model, promptVersion: options.promptVersion, input: options.input, usage: data.usage, ok: true });
    return (options.schema ? JSON.parse(text) : text) as T;
  } catch (error) {
    await logRun({ step: options.step, model, promptVersion: options.promptVersion, input: options.input, ok: false, error: String(error).slice(0, 500) });
    throw error;
  }
}

/** True when OpenAI's moderation model flags the text. */
export async function flaggedByOpenAI(text: string): Promise<boolean> {
  const data = (await post("/moderations", { model: "omni-moderation-latest", input: text })) as { results?: Array<{ flagged?: boolean }> };
  await logRun({ step: "chat_moderation", model: "omni-moderation-latest", promptVersion: "moderation-v1", input: text, ok: true });
  return Boolean(data.results?.[0]?.flagged);
}
