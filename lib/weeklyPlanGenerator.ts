import { z } from "zod";

const modelSelectionSchema = z.object({
  recipeId: z.string().min(1),
  reason: z.string().trim(),
});

const modelResponseSchema = z.object({
  selections: z.array(modelSelectionSchema),
  summary: z.string().trim(),
});

export type MealPlanRecipeContext = {
  id: string;
  title: string;
  tags: string[];
  ingredients: string[];
  servings: string | null;
  prepTimeMinutes: number | null;
  cookTimeMinutes: number | null;
  description: string | null;
};

export type MealPlanSlot = {
  dayIndex: number;
  dateISO: string;
  weekday: string;
  isWeekend: boolean;
};

type ResponsesPayload = {
  id?: unknown;
  status?: unknown;
  output_text?: unknown;
  output?: Array<{ content?: Array<{ text?: unknown }> }>;
  incomplete_details?: { reason?: unknown } | null;
  usage?: {
    input_tokens?: unknown;
    output_tokens?: unknown;
    output_tokens_details?: { reasoning_tokens?: unknown } | null;
  } | null;
};

function extractText(value: unknown): string {
  const payload = value as ResponsesPayload | null;
  if (typeof payload?.output_text === "string" && payload.output_text.trim()) return payload.output_text;
  return (
    payload?.output
      ?.flatMap((item) => item.content ?? [])
      .map((chunk) => (typeof chunk.text === "string" ? chunk.text : ""))
      .join("\n")
      .trim() || ""
  );
}

function responseDiagnostics(value: unknown) {
  const payload = value as ResponsesPayload | null;
  return {
    responseId: typeof payload?.id === "string" ? payload.id : null,
    status: typeof payload?.status === "string" ? payload.status : null,
    incompleteReason:
      typeof payload?.incomplete_details?.reason === "string"
        ? payload.incomplete_details.reason
        : null,
    inputTokens:
      typeof payload?.usage?.input_tokens === "number" ? payload.usage.input_tokens : null,
    outputTokens:
      typeof payload?.usage?.output_tokens === "number" ? payload.usage.output_tokens : null,
    reasoningTokens:
      typeof payload?.usage?.output_tokens_details?.reasoning_tokens === "number"
        ? payload.usage.output_tokens_details.reasoning_tokens
        : null,
  };
}

function compactRecipe(recipe: MealPlanRecipeContext) {
  return {
    id: recipe.id,
    title: recipe.title,
    tags: recipe.tags,
    ingredients: recipe.ingredients.slice(0, 8),
    ...(recipe.prepTimeMinutes === null ? {} : { prepMinutes: recipe.prepTimeMinutes }),
    ...(recipe.cookTimeMinutes === null ? {} : { cookMinutes: recipe.cookTimeMinutes }),
    ...(recipe.description ? { description: recipe.description.slice(0, 240) } : {}),
  };
}

export async function generateMealPlan({
  workspaceSlug,
  scope,
  prompt,
  slots,
  recipes,
}: {
  workspaceSlug: string;
  scope: "week" | "month";
  prompt: string;
  slots: MealPlanSlot[];
  recipes: MealPlanRecipeContext[];
}) {
  const started = Date.now();
  if (!process.env.OPENAI_API_KEY) throw new Error("Missing OpenAI API key");

  const model = process.env.OPENAI_MODEL_WEEKLY_PLAN ?? "gpt-5-mini";
  console.log("[Meal Plan Generator] start", {
    slug: workspaceSlug,
    scope,
    model,
    recipeCount: recipes.length,
    dayCount: slots.length,
    promptLength: prompt.length,
  });

  const systemPrompt = `Create a ${scope === "month" ? "monthly" : "weekly"} family meal plan using only the supplied recipe library.
Return one selection for every calendar slot, in the exact order supplied.
Honour the user's instructions as the primary planning rules.
Use tags, titles, descriptions and ingredients to infer cuisine and suitability.
For a month, balance each individual week as far as the library permits, not just the month as a whole.
Avoid the same recipe in adjacent weeks. Repeating a recipe later in a month is allowed when it helps satisfy the prompt.
Use Family Favourite-tagged recipes for weekend requests wherever possible.
Prefer quick or simple meals midweek and more involved meals on weekends unless instructed otherwise.
Do not invent recipes or recipe IDs.`;

  const recipeIds = recipes.map((recipe) => recipe.id);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55_000);

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        reasoning: { effort: "low" },
        max_output_tokens: scope === "month" ? 4800 : 1800,
        text: {
          verbosity: "low",
          format: {
            type: "json_schema",
            name: "family_meal_plan",
            strict: true,
            schema: {
              type: "object",
              properties: {
                selections: {
                  type: "array",
                  minItems: slots.length,
                  maxItems: slots.length,
                  items: {
                    type: "object",
                    properties: {
                      recipeId: { type: "string", enum: recipeIds },
                      reason: { type: "string" },
                    },
                    required: ["recipeId", "reason"],
                    additionalProperties: false,
                  },
                },
                summary: { type: "string" },
              },
              required: ["selections", "summary"],
              additionalProperties: false,
            },
          },
        },
        input: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `User instructions:\n${prompt}\n\nCalendar slots:\n${JSON.stringify(slots)}\n\nRecipe library:\n${JSON.stringify(recipes.map(compactRecipe))}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`OpenAI error ${response.status}: ${body.slice(0, 300)}`);
    }

    const payload: unknown = await response.json();
    const diagnostics = responseDiagnostics(payload);
    const text = extractText(payload);
    if (!text) {
      throw new Error(`OpenAI response had no output text (${JSON.stringify(diagnostics)})`);
    }

    const parsedJson: unknown = JSON.parse(text);
    const parsed = modelResponseSchema.safeParse(parsedJson);
    if (!parsed.success || parsed.data.selections.length !== slots.length) {
      throw new Error(`OpenAI returned an invalid structured plan (${JSON.stringify(diagnostics)})`);
    }

    const validIds = new Set(recipeIds);
    if (parsed.data.selections.some((selection) => !validIds.has(selection.recipeId))) {
      throw new Error(`OpenAI returned an unknown recipe ID (${JSON.stringify(diagnostics)})`);
    }

    console.log("[Meal Plan Generator] success", {
      slug: workspaceSlug,
      scope,
      durationMs: Date.now() - started,
      ...diagnostics,
    });

    return {
      days: parsed.data.selections.map((selection, index) => ({
        dayIndex: index + 1,
        recipeId: selection.recipeId,
        reason: selection.reason.slice(0, 160),
      })),
      summary: parsed.data.summary.slice(0, 240),
    };
  } catch (error) {
    console.error("[Meal Plan Generator] failed", {
      slug: workspaceSlug,
      scope,
      durationMs: Date.now() - started,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
