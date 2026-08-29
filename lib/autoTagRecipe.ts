import "server-only";

import { prisma } from "@/lib/db";
import { normalizeTagName } from "@/lib/normalizeTagName";

type AutoTagRecipeInput = {
  recipeId: string;
  workspaceId: string;
  title: string;
  description: string | null;
  ingredients: string[];
  prepTimeMinutes: number | null;
  cookTimeMinutes: number | null;
};

type ResponsesPayload = {
  output_text?: unknown;
  output?: Array<{ content?: Array<{ text?: unknown }> }>;
};

function extractText(value: unknown): string {
  const payload = value as ResponsesPayload | null;
  if (typeof payload?.output_text === "string") return payload.output_text;
  return (
    payload?.output
      ?.flatMap((item) => item.content ?? [])
      ?.map((chunk) => (typeof chunk.text === "string" ? chunk.text : ""))
      ?.join("\n")
      ?.trim() ?? ""
  );
}

function parseTags(text: string): string[] {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "");
  const parsed = JSON.parse(cleaned);
  const values = Array.isArray(parsed) ? parsed : parsed?.tags;
  if (!Array.isArray(values)) throw new Error("Invalid auto-tag response");

  const unique = new Map<string, string>();
  for (const value of values) {
    if (typeof value !== "string") continue;
    const name = value.trim().replace(/\s+/g, " ").slice(0, 32);
    const normalized = normalizeTagName(name);
    if (name && normalized && !unique.has(normalized)) unique.set(normalized, name);
  }
  return [...unique.values()].slice(0, 6);
}

export async function autoTagRecipe(input: AutoTagRecipeInput) {
  if (!process.env.OPENAI_API_KEY) return [];

  const existingTags = await prisma.tag.findMany({
    where: { workspaceId: input.workspaceId },
    orderBy: { name: "asc" },
    select: { name: true },
  });

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL_RECIPE_TAGGING ?? "gpt-5-mini",
      max_output_tokens: 600,
      input: [
        {
          role: "system",
          content:
            "Classify a recipe with 2 to 6 concise tags. Cover cuisine, main ingredient or dietary style, meal style, and useful planning traits such as Quick, Weeknight, Weekend, Healthy, Comfort Food, Cheap, or High Protein when supported. Prefer an existing workspace tag when it fits, but create a clear cuisine or food-style tag when useful. Never tag Family Favourite because that is a personal judgement. Return JSON only as {\"tags\":[\"Tag\"]}.",
        },
        {
          role: "user",
          content: JSON.stringify({
            recipe: {
              title: input.title,
              description: input.description,
              ingredients: input.ingredients.slice(0, 30),
              prepTimeMinutes: input.prepTimeMinutes,
              cookTimeMinutes: input.cookTimeMinutes,
            },
            existingWorkspaceTags: existingTags.map((tag) => tag.name),
          }),
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Auto-tagging failed with status ${response.status}`);
  }

  const tags = parseTags(extractText(await response.json()));
  for (const name of tags) {
    const nameNormalized = normalizeTagName(name);
    const tag = await prisma.tag.upsert({
      where: {
        workspaceId_nameNormalized: { workspaceId: input.workspaceId, nameNormalized },
      },
      update: {},
      create: { workspaceId: input.workspaceId, name, nameNormalized },
      select: { id: true },
    });
    await prisma.recipeTag.upsert({
      where: { recipeId_tagId: { recipeId: input.recipeId, tagId: tag.id } },
      update: {},
      create: { recipeId: input.recipeId, tagId: tag.id },
    });
  }

  return tags;
}
