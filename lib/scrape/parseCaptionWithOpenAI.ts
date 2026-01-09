import "server-only";

import { createHash } from "crypto";

export type CaptionRecipeFields = {
  title: string | null;
  description: string | null;
  ingredients: string[];
  directions: string[];
  prepTimeMinutes: number | null;
  cookTimeMinutes: number | null;
  totalTimeMinutes: number | null;
  servings: string | null;
  yields: string | null;
};

type CaptionRecipeRequest = {
  captionText: string;
  sourceDomain: "instagram" | "tiktok";
};

const SYSTEM_PROMPT =
  "You are a precise data extraction engine.\n" +
  "You do not explain.\n" +
  "You do not guess.\n" +
  "You only return valid JSON.\n" +
  "If data is missing or unclear, you return null or an empty array.\n" +
  "\n" +
  "Extraction rules:\n" +
  "- Title: Prefer a clear dish name at the start of the caption. Remove emojis, macros, hashtags, and CTAs. If no clear dish name exists, return null.\n" +
  "- Description: Short paragraph describing the dish. Exclude ingredients, steps, CTAs, and hashtags.\n" +
  "- Ingredients: Extract only ingredient lines. Preserve quantities and units as plain text. One ingredient per array item.\n" +
  "- Directions: Extract cooking steps in order. One step per array item. Remove fluff, jokes, and promotional language.\n" +
  "- Times: Only return minutes if explicitly stated. Convert ranges to average (e.g., 5–10 min → 8). Otherwise return null.\n" +
  "- Servings/Yields: Extract if explicitly stated (\"serves 4\", \"feeds 2\"). Otherwise return null.\n" +
  "\n" +
  "Return JSON with exactly these keys: title, description, ingredients, directions, prepTimeMinutes, cookTimeMinutes, totalTimeMinutes, servings, yields.";

const captionCache = new Map<string, Promise<CaptionRecipeFields | null>>();

function shouldLogDebug() {
  return process.env.SCRAPER_DEBUG === "1" || process.env.NODE_ENV !== "production";
}

function buildCacheKey(request: CaptionRecipeRequest) {
  const hash = createHash("sha256").update(request.captionText).digest("hex");
  return `${request.sourceDomain}:${hash}`;
}

function normalizeString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => typeof item === "string");
}

function normalizeNumber(value: unknown) {
  if (typeof value !== "number" || Number.isNaN(value)) return null;
  return value;
}

function coerceRecipeFields(value: unknown): CaptionRecipeFields | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  return {
    title: normalizeString(record.title),
    description: normalizeString(record.description),
    ingredients: normalizeStringArray(record.ingredients),
    directions: normalizeStringArray(record.directions),
    prepTimeMinutes: normalizeNumber(record.prepTimeMinutes),
    cookTimeMinutes: normalizeNumber(record.cookTimeMinutes),
    totalTimeMinutes: normalizeNumber(record.totalTimeMinutes),
    servings: normalizeString(record.servings),
    yields: normalizeString(record.yields),
  };
}

function extractResponseText(payload: any) {
  if (typeof payload?.output_text === "string") {
    return payload.output_text;
  }

  const output = payload?.output;
  if (!Array.isArray(output)) return null;
  const chunks = output.flatMap((item: any) => item?.content ?? []);
  const texts = chunks
    .filter((item: any) => item?.type === "output_text" && typeof item.text === "string")
    .map((item: any) => item.text);
  return texts.join("").trim() || null;
}

export async function parseCaptionWithOpenAI(
  request: CaptionRecipeRequest,
): Promise<CaptionRecipeFields | null> {
  if (!request.captionText.trim()) return null;
  if (!request.sourceDomain) return null;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    if (shouldLogDebug()) {
      console.log("OpenAI caption parse skipped: missing OPENAI_API_KEY", {
        sourceDomain: request.sourceDomain,
        captionLength: request.captionText.length,
      });
    }
    return null;
  }

  const cacheKey = buildCacheKey(request);
  const cached = captionCache.get(cacheKey);
  if (cached) {
    if (shouldLogDebug()) {
      console.log("OpenAI caption parse cache hit", {
        sourceDomain: request.sourceDomain,
        captionLength: request.captionText.length,
      });
    }
    return cached;
  }

  const task = (async () => {
    try {
      if (shouldLogDebug()) {
        console.log("OpenAI caption parse request", {
          sourceDomain: request.sourceDomain,
          captionLength: request.captionText.length,
        });
      }
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-5-nano",
          input: [
            {
              role: "system",
              content: [{ type: "input_text", text: SYSTEM_PROMPT }],
            },
            {
              role: "user",
              content: [{ type: "input_text", text: request.captionText }],
            },
          ],
          text: { format: { type: "json_object" } },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (shouldLogDebug()) {
          console.log("OpenAI caption parse HTTP error", {
            sourceDomain: request.sourceDomain,
            status: response.status,
            body: errorText.slice(0, 500),
          });
        }
        throw new Error(`OpenAI error ${response.status}`);
      }

      const payload = await response.json();
      const text = extractResponseText(payload);
      if (!text) {
        if (shouldLogDebug()) {
          console.log("OpenAI caption parse response missing output_text", {
            sourceDomain: request.sourceDomain,
          });
        }
        return null;
      }
      const parsed = JSON.parse(text);
      const coerced = coerceRecipeFields(parsed);
      if (shouldLogDebug()) {
        console.log("OpenAI caption parse response", {
          sourceDomain: request.sourceDomain,
          hasTitle: Boolean(coerced?.title),
          ingredientCount: coerced?.ingredients.length ?? 0,
          directionCount: coerced?.directions.length ?? 0,
        });
      }
      return coerced;
    } catch (error) {
      if (shouldLogDebug()) {
        console.log("OpenAI caption parse failed", {
          sourceDomain: request.sourceDomain,
          message: error instanceof Error ? error.message : String(error),
        });
      }
      return null;
    }
  })();

  captionCache.set(cacheKey, task);
  const result = await task;
  if (!result) {
    captionCache.delete(cacheKey);
  }
  return result;
}
