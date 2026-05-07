import { z } from "zod";

const WEEK_DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

type WeekDay = (typeof WEEK_DAYS)[number];

const daySchema = z.object({
  day: z.enum(WEEK_DAYS),
  recipeId: z.string().min(1),
  reason: z.string().trim().max(200).optional().default(""),
});

const responseSchema = z.object({
  days: z.array(daySchema).length(7),
  summary: z.string().trim().max(240).optional().default(""),
});

export type WeeklyPlanRecipeContext = {
  id: string;
  title: string;
  tags: string[];
  ingredients: string[];
  servings: string | null;
  prepTimeMinutes: number | null;
  cookTimeMinutes: number | null;
  description: string | null;
};

export type WeeklyPlanSuggestion = z.infer<typeof responseSchema>;

function extractText(payload: any): string {
  if (typeof payload?.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text;
  }
  const text = payload?.output
    ?.flatMap((item: any) => item?.content ?? [])
    ?.map((chunk: any) => (typeof chunk?.text === "string" ? chunk.text : ""))
    ?.join("\n")
    ?.trim();
  return text || "";
}

function validateWeeklyPlan(data: unknown, validIds: Set<string>, allowDuplicates: boolean) {
  const parsed = responseSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error("Invalid plan shape");
  }
  const value = parsed.data;
  const ordered = [...value.days].sort(
    (a, b) => WEEK_DAYS.indexOf(a.day) - WEEK_DAYS.indexOf(b.day),
  );
  if (ordered.some((entry, index) => entry.day !== WEEK_DAYS[index])) {
    throw new Error("Days must be Monday to Sunday");
  }
  const seen = new Set<string>();
  for (const day of ordered) {
    if (!validIds.has(day.recipeId)) {
      throw new Error("Plan contains unknown recipe IDs");
    }
    if (!allowDuplicates && seen.has(day.recipeId)) {
      throw new Error("Plan contains duplicate recipe IDs");
    }
    seen.add(day.recipeId);
  }
  return { ...value, days: ordered };
}

export async function generateWeeklyPlan({
  workspaceSlug,
  prompt,
  recipes,
}: {
  workspaceSlug: string;
  prompt: string;
  recipes: WeeklyPlanRecipeContext[];
}) {
  const started = Date.now();
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OpenAI API key");
  }

  const model = process.env.OPENAI_MODEL_WEEKLY_PLAN ?? "gpt-5-mini";
  console.log("[Weekly Plan Generator] start", {
    slug: workspaceSlug,
    recipeCount: recipes.length,
    promptLength: prompt.length,
  });

  const systemPrompt = `You are generating a weekly meal plan for a family.
You may only choose recipes from the provided recipe library.
You must return exactly 7 days: Monday to Sunday.
Each day must contain exactly one recipeId.
Do not invent recipes.
Do not return recipe names that do not exist in the provided library.
Prefer variety.
Avoid using the same recipe twice unless the user explicitly asks.
Honour the user's prompt where possible.
If the user asks for cheap meals, prefer recipes tagged cheap/budget or recipes with simple/common ingredients.
If the user asks for chicken/fish/pasta/vegetarian/etc, use tags, title and ingredients to infer suitability.
Weekend meals can be heartier or more involved.
Midweek meals should generally be simpler/quicker where possible.
Return JSON only.
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
        input: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `${extraInstruction ? `${extraInstruction}\n\n` : ""}User prompt:\n${prompt}\n\nRecipe library JSON:\n${JSON.stringify(recipes)}`,
          },
        ],
      }),
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`OpenAI error ${response.status}: ${body.slice(0, 180)}`);
    }
    const payload = await response.json();
    const text = extractText(payload);
    if (!text) throw new Error("OpenAI response missing output text");
    return JSON.parse(text);
  };

  const validIds = new Set(recipes.map((r) => r.id));
  const allowDuplicates = /same recipe|repeat|leftover|duplicates?/i.test(prompt);

  try {
    const first = await attempt();
    const plan = validateWeeklyPlan(first, validIds, allowDuplicates);
    console.log("[Weekly Plan Generator] validation success", { slug: workspaceSlug, durationMs: Date.now() - started });
    return plan;
  } catch (error) {
    console.log("[Weekly Plan Generator] validation failed", {
      slug: workspaceSlug,
      durationMs: Date.now() - started,
      error: error instanceof Error ? error.message : String(error),
    });
    const second = await attempt(
      "Your last answer was invalid. Return strict JSON with Monday-Sunday and only valid recipeId values from recipe library.",
    );
    const plan = validateWeeklyPlan(second, validIds, allowDuplicates);
    console.log("[Weekly Plan Generator] validation success", { slug: workspaceSlug, durationMs: Date.now() - started, retry: true });
    return plan;
  }
}
