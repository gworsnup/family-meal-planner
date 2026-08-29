import { z } from "zod";

const planDaySchema = z.object({
  dayIndex: z.number().int().positive(),
  recipeId: z.string().min(1),
  reason: z.string().trim().max(200).optional().default(""),
});

const responseSchema = z.object({
  days: z.array(planDaySchema),
  summary: z.string().trim().max(240).optional().default(""),
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
  output_text?: unknown;
  output?: Array<{ content?: Array<{ text?: unknown }> }>;
};

function extractText(value: unknown): string {
  const payload = value as ResponsesPayload | null;
  if (typeof payload?.output_text === "string" && payload.output_text.trim()) return payload.output_text;
  return (
    payload?.output
      ?.flatMap((item) => item.content ?? [])
      ?.map((chunk) => (typeof chunk.text === "string" ? chunk.text : ""))
      ?.join("\n")
      ?.trim() || ""
  );
}

function parseJsonResponse(text: string) {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  if (!cleaned) throw new Error("OpenAI response was empty");
  return JSON.parse(cleaned);
}

function validatePlan(
  data: unknown,
  slots: MealPlanSlot[],
  validIds: Set<string>,
  allowDuplicates: boolean,
) {
  const parsed = responseSchema.safeParse(data);
  if (!parsed.success || parsed.data.days.length !== slots.length) throw new Error("Invalid plan shape");
  const ordered = [...parsed.data.days].sort((a, b) => a.dayIndex - b.dayIndex);
  const seen = new Set<string>();
  for (let index = 0; index < ordered.length; index += 1) {
    const day = ordered[index];
    if (day.dayIndex !== index + 1) throw new Error("Plan days are incomplete");
    if (!validIds.has(day.recipeId)) throw new Error("Plan contains unknown recipe IDs");
    if (!allowDuplicates && seen.has(day.recipeId)) throw new Error("Plan contains duplicate recipe IDs");
    seen.add(day.recipeId);
  }
  return { ...parsed.data, days: ordered };
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
    recipeCount: recipes.length,
    dayCount: slots.length,
    promptLength: prompt.length,
  });

  const systemPrompt = `You are generating a ${scope === "month" ? "monthly" : "weekly"} meal plan for a family.
You may only choose recipes from the provided recipe library.
Return exactly ${slots.length} entries, one for every supplied calendar slot, numbered 1 through ${slots.length}.
Each entry must contain dayIndex, recipeId, and a short reason.
Do not invent recipes or IDs.
Honour the user's prompt as the primary planning instruction.
Create meaningful variety across the whole period: rotate cuisines, proteins, ingredients and food styles.
Use recipe tags, titles, descriptions and ingredients to infer suitability.
Treat weekend-specific requests as applying to slots marked isWeekend. If the user requests Family Favourite meals on weekends, select recipes carrying that tag for those slots wherever the library permits.
Midweek meals should generally be simpler or quicker, while weekends can be heartier or more involved, unless the prompt says otherwise.
Avoid repeating recipes unless the library has fewer recipes than slots or the user asks for repeats or leftovers.
Return strict JSON only as {"days":[{"dayIndex":1,"recipeId":"...","reason":"..."}],"summary":"..."}.
No markdown.`;

  const attempt = async (extraInstruction?: string) => {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_output_tokens: scope === "month" ? 7000 : 2200,
        input: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `${extraInstruction ? `${extraInstruction}\n\n` : ""}User prompt:\n${prompt}\n\nCalendar slots JSON:\n${JSON.stringify(slots)}\n\nRecipe library JSON:\n${JSON.stringify(recipes)}`,
          },
        ],
      }),
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`OpenAI error ${response.status}: ${body.slice(0, 180)}`);
    }
    return parseJsonResponse(extractText(await response.json()));
  };

  const validIds = new Set(recipes.map((recipe) => recipe.id));
  const allowDuplicates = recipes.length < slots.length || /same recipe|repeat|leftover|duplicates?/i.test(prompt);

  try {
    const plan = validatePlan(await attempt(), slots, validIds, allowDuplicates);
    console.log("[Meal Plan Generator] validation success", {
      slug: workspaceSlug,
      scope,
      durationMs: Date.now() - started,
    });
    return plan;
  } catch (error) {
    console.log("[Meal Plan Generator] validation failed", {
      slug: workspaceSlug,
      scope,
      durationMs: Date.now() - started,
      error: error instanceof Error ? error.message : String(error),
    });
    const retry = await attempt(
      `Your last answer was invalid. Return exactly ${slots.length} entries numbered 1 through ${slots.length}, using only valid recipeId values from the library.`,
    );
    return validatePlan(retry, slots, validIds, allowDuplicates);
  }
}
