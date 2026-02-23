import OpenAI from "openai";
import { z } from "zod";
import { InsightPayload } from "./types";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const chartSpecSchema = z.object({
  id: z.string(),
  type: z.enum(["line", "bar", "area", "pie"]),
  title: z.string(),
  xKey: z.string().optional(),
  yKeys: z.array(z.string()).optional(),
  categoryKey: z.string().optional(),
  valueKey: z.string().optional(),
  data: z.array(z.record(z.union([z.string(), z.number(), z.null()]))),
  notes: z.string().optional(),
});

const payloadSchema = z.object({
  assistantMessage: z.string(),
  insight: z.object({
    title: z.string(),
    summary: z.string(),
    tags: z.array(z.string()),
    sql: z.string(),
    charts: z.array(chartSpecSchema),
  }),
});

export const SYSTEM_PROMPT = `You are InsightPulse AI analyst. Always respond with STRICT JSON only (no markdown) with schema:
{
  "assistantMessage": "string",
  "insight": {
    "title": "string",
    "summary": "string",
    "tags": ["string"],
    "sql": "single SELECT or WITH query only",
    "charts": [
      {
        "id": "string",
        "type": "line|bar|area|pie",
        "title": "string",
        "xKey": "string optional",
        "yKeys": ["string optional"],
        "categoryKey": "string optional",
        "valueKey": "string optional",
        "data": [{"any": "json"}],
        "notes": "string optional"
      }
    ]
  }
}
Rules: max 3 charts. SQL must query SaaS analytics schema and include LIMIT <= 200. Multilingual RU/EN answering based on user locale.`;

function extractText(output: OpenAI.Responses.Response): string {
  const chunks = output.output
    .flatMap((o) => ("content" in o && Array.isArray(o.content) ? o.content : []))
    .flatMap((c) => ("text" in c ? [c.text] : []));
  return chunks.join("\n").trim();
}

export async function generateInsight(userInput: string): Promise<{ assistantMessage: string; insight: Omit<InsightPayload, "columns" | "rows"> }> {
  const model = process.env.OPENAI_MODEL ?? "gpt-5.2";

  const first = await client.responses.create({
    model,
    instructions: SYSTEM_PROMPT,
    input: userInput,
  });

  const raw = extractText(first);
  try {
    const parsed = payloadSchema.parse(JSON.parse(raw));
    return {
      assistantMessage: parsed.assistantMessage,
      insight: {
        ...parsed.insight,
        dashboardHint: { layout: "grid" },
      },
    };
  } catch {
    const retry = await client.responses.create({
      model,
      instructions: `${SYSTEM_PROMPT}\nReturn valid JSON only. No extra text.`,
      input: userInput,
    });
    const retryRaw = extractText(retry);
    const parsed = payloadSchema.parse(JSON.parse(retryRaw));
    return {
      assistantMessage: parsed.assistantMessage,
      insight: {
        ...parsed.insight,
        dashboardHint: { layout: "grid" },
      },
    };
  }
}
