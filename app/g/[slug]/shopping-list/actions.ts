"use server";

import "server-only";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { buildAggregatedSourceView, type WeekList } from "@/lib/ingredientParsing";
import { endOfWeek, formatDateISO } from "@/lib/planDates";
import type { SmartListData, SmartListItem } from "@/lib/smartListTypes";
import { SMART_LIST_CATEGORIES } from "@/lib/smartListConfig";
import { randomUUID } from "crypto";
import { requireWorkspaceUser } from "@/lib/auth";

const SYSTEM_PROMPT =
  "You are a shopping list normalizer and aggregator.\n" +
  "\n" +
  "Return ONLY strict JSON that matches the provided schema. No prose.\n" +
  "\n" +
  "────────────────────────────────────────────────\n" +
  "WORKFLOW (MUST FOLLOW IN ORDER)\n" +
  "1) Parse all provided source ingredient lines into candidate items.\n" +
  "   - Do NOT lose or rewrite quantities at this stage.\n" +
  "2) Canonicalize names:\n" +
  "   - singular form\n" +
  "   - remove preparation words that do NOT change what is purchased\n" +
  "     (e.g., chopped, crushed, squeezed, freshly)\n" +
  "3) Split combined ingredients:\n" +
  "   - If a source line contains \" X and Y \" (e.g., \"salt and pepper\"),\n" +
  "     split into separate items X and Y.\n" +
  "4) Merge across the ENTIRE list:\n" +
  "   - Ignore categories while merging.\n" +
  "   - Categories are assigned ONLY after all merging is complete.\n" +
  "5) Validate arithmetic, units, and duplicates.\n" +
  "   - Fix any violations before returning JSON.\n" +
  "\n" +
  "────────────────────────────────────────────────\n" +
  "HARD RULES\n" +
  "- Never invent ingredients or quantities.\n" +
  "- Use ONLY the provided source lines.\n" +
  "- Convert units ONLY when widely standard and unambiguous.\n" +
  "- If anything is uncertain (identity, unit, density, typical size),\n" +
  "  KEEP the original unit and set isEstimated=true.\n" +
  "- When merging, you MUST:\n" +
  "  a) prove they are the same ingredient (obvious synonym or purchase intent),\n" +
  "  b) include all source lines in mergedFrom,\n" +
  "  c) compute totals correctly (sum first, round last),\n" +
  "  d) preserve the most user-friendly unit.\n" +
  "\n" +
  "────────────────────────────────────────────────\n" +
  "EXPLICIT MERGE TARGETS (DO NOT SKIP)\n" +
  "- parsley + flat-leaf parsley + chopped fresh parsley → \"fresh parsley\"\n" +
  "- spring onion + spring onions → \"spring onions\"\n" +
  "- lemon (whole) + lemon juice (fresh) + lemon zest → prefer ONE purchasable item \"lemons\"\n" +
  "  - If conversion to whole lemons is uncertain, still merge and set isEstimated=true.\n" +
  "  - Keep juice/zest details in mergedFrom and/or notes.\n" +
  "- soy sauce variants (dark, reduced-salt, light, unspecified) → \"soy sauce\"\n" +
  "  - Keep subtype details in notes if relevant.\n" +
  "- sesame oil variants (toasted / regular / unspecified) → \"sesame oil\"\n" +
  "- olive oil variants (extra-virgin / unspecified) → \"olive oil\"\n" +
  "- pasta duplicates (e.g., pappardelle) → one item\n" +
  "- nuts listed as \"handful\", \"small handful\", etc. → keep unit, mark isEstimated=true\n" +
  "\n" +
  "DO NOT MERGE:\n" +
  "- ingredients that clearly require separate purchases\n" +
  "  (e.g., parmesan wedge vs grated parmesan unless explicitly same)\n" +
  "\n" +
  "────────────────────────────────────────────────\n" +
  "UNIT SANITY RULES (STRICT)\n" +
  "- Do NOT use ml for solids (bread, cheese, nuts, lentils, tofu, pasta).\n" +
  "- Do NOT use g for liquids (oils, sauces, vinegar).\n" +
  "- For herbs & spices:\n" +
  "  - fresh → pcs / bunch / g\n" +
  "  - dried → tsp / tbsp / pinch\n" +
  "- Avoid fractional pcs:\n" +
  "  - Round UP to whole pcs\n" +
  "  - Set isEstimated=true\n" +
  "- If quantity is \"to taste\" or \"optional\":\n" +
  "  - Output as quantity = 1 unit\n" +
  "  - Set isEstimated=true\n" +
  "  - Note \"to taste\" or \"optional\"\n" +
  "\n" +
  "────────────────────────────────────────────────\n" +
  "CATEGORIES (MUST BE EXACTLY ONE OF THESE)\n" +
  "- Fresh Produce (Fruit, Veg, Fresh Herbs)\n" +
  "- Meat & Seafood\n" +
  "- Dairy, Eggs, Cheese & Fridge\n" +
  "- Dry Herbs & Spices\n" +
  "- Condiments & Sauces\n" +
  "- Pasta & Grains\n" +
  "- Oils & Vinegars\n" +
  "- Flours, Bakery & Sugars\n" +
  "- Pantry (Biscuits, tins, other)\n" +
  "- Frozen\n" +
  "- Other\n" +
  "\n" +
  "────────────────────────────────────────────────\n" +
  "CATEGORY ASSIGNMENT RULES (FIRST MATCH WINS)\n" +
  "1) Fresh Produce\n" +
  "   - fresh fruit, vegetables, salad leaves, fresh herbs,\n" +
  "     onions, garlic, ginger, chillies, mushrooms, citrus\n" +
  "2) Meat & Seafood\n" +
  "   - all meat, poultry, fish, shellfish, bacon, ham\n" +
  "3) Dairy, Eggs, Cheese & Fridge\n" +
  "   - milk, cream, butter, yogurt, cheese, eggs, buttermilk, tofu,\n" +
  "     chilled ready items\n" +
  "4) Dry Herbs & Spices\n" +
  "   - dried herbs, spices, salt, pepper, spice blends\n" +
  "5) Oils & Vinegars\n" +
  "   - all cooking oils, olive oil, sesame oil, vinegars\n" +
  "6) Condiments & Sauces\n" +
  "   - soy sauce, fish sauce, oyster sauce, ketchup, mayo, mustard,\n" +
  "     curry pastes, stock cubes, honey, jams, dressings\n" +
  "7) Pasta & Grains\n" +
  "   - pasta, rice, noodles, couscous, quinoa, oats\n" +
  "8) Flours, Bakery & Sugars\n" +
  "   - flour, sugar, bread, rolls, buns, breadcrumbs, baking powder,\n" +
  "     yeast\n" +
  "9) Pantry (Biscuits, tins, other)\n" +
  "   - canned goods, lentils, beans, pulses, nuts, seeds,\n" +
  "     nut butters, chocolate, snacks\n" +
  "10) Frozen\n" +
  "   - explicitly frozen items\n" +
  "11) Other\n" +
  "   - ONLY if none of the above apply\n" +
  "\n" +
  "CATEGORY CONSTRAINTS\n" +
  "- Fresh Produce must NEVER appear in Pantry or Other.\n" +
  "- Oils must NEVER appear in Condiments unless explicitly a sauce.\n" +
  "- Canned or jarred goods must NEVER appear in Other.\n" +
  "\n" +
  "────────────────────────────────────────────────\n" +
  "OUTPUT REQUIREMENTS\n" +
  "Each item MUST include:\n" +
  "- name (canonical, shopper-facing)\n" +
  "- quantity + unit (user-facing)\n" +
  "- isEstimated (boolean)\n" +
  "- category (from enum above)\n" +
  "- mergedFrom (array of original source strings with quantities/units)\n" +
  "- notes (optional, ONLY if needed to explain estimation, rounding, or subtype detail)\n";

type SmartListLLMItem = {
  name?: string;
  displayText?: string;
  quantityValue?: number | null;
  quantityUnit?: string | null;
  isEstimated?: boolean;
  isMerged?: boolean;
  mergedFrom?: string[];
  sources?: string[];
  notes?: string | null;
};

type SmartListLLMCategory = {
  name: string;
  items: SmartListLLMItem[];
};

type SmartListLLMResponse = {
  categories: SmartListLLMCategory[];
  notes?: string[];
};

type OpenAIContentChunk = {
  type?: string;
  text?: string;
};

type OpenAIOutputItem = {
  content?: OpenAIContentChunk[];
};

type OpenAIResponsePayload = {
  output_text?: string;
  output?: OpenAIOutputItem[];
};

function extractResponseText(payload: OpenAIResponsePayload | null) {
  if (payload && typeof payload.output_text === "string") {
    return payload.output_text;
  }

  const output = payload?.output;
  if (!Array.isArray(output)) return null;
  const chunks = output.flatMap((item) => item.content ?? []);
  const texts = chunks
    .filter((item) => item.type === "output_text" && typeof item.text === "string")
    .map((item) => item.text as string);
  return texts.join("").trim() || null;
}

function normalizeCategory(name: string) {
  const match = SMART_LIST_CATEGORIES.find(
    (category) => category.toLowerCase() === name.trim().toLowerCase(),
  );
  return match ?? "Other";
}

function sanitizeText(value: string, maxLength: number) {
  const stripped = value.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  if (stripped.length <= maxLength) return stripped;
  return `${stripped.slice(0, maxLength - 1)}…`;
}

function buildSmartListData(
  record: {
    id: string;
    weekId: string;
    version: number;
    model: string;
    createdAt: Date;
    items: Array<{
      id: string;
      category: string;
      displayText: string;
      quantityValue: Prisma.Decimal | null;
      quantityUnit: string | null;
      isEstimated: boolean;
      isMerged: boolean;
      sortKey: number;
      provenance: Array<{
        id: string;
        sourceText: string;
        sourceRecipeId: string | null;
        sourceCount: number | null;
        notes: string | null;
      }>;
    }>;
  },
): SmartListData {
  const categoryMap = new Map<string, SmartListItem[]>();
  record.items.forEach((item) => {
    const entry: SmartListItem = {
      id: item.id,
      category: item.category,
      displayText: item.displayText,
      quantityValue: item.quantityValue ? Number(item.quantityValue) : null,
      quantityUnit: item.quantityUnit ?? null,
      isEstimated: item.isEstimated,
      isMerged: item.isMerged,
      sortKey: item.sortKey,
      provenance: item.provenance.map((prov) => ({
        id: prov.id,
        sourceText: prov.sourceText,
        sourceRecipeId: prov.sourceRecipeId,
        sourceCount: prov.sourceCount,
        notes: prov.notes,
      })),
    };
    const existing = categoryMap.get(item.category) ?? [];
    existing.push(entry);
    categoryMap.set(item.category, existing);
  });

  const categories = SMART_LIST_CATEGORIES.filter((name) => categoryMap.has(name))
    .map((name) => ({
      name,
      items: (categoryMap.get(name) ?? []).sort((a, b) => a.sortKey - b.sortKey),
    }))
    .concat(
      Array.from(categoryMap.entries())
        .filter(([name]) => !SMART_LIST_CATEGORIES.includes(name))
        .map(([name, items]) => ({
          name,
          items: items.sort((a, b) => a.sortKey - b.sortKey),
        })),
    );

  return {
    id: record.id,
    weekId: record.weekId,
    version: record.version,
    model: record.model,
    categories,
    createdAt: record.createdAt.toISOString(),
  };
}

export async function generateSmartList({
  slug,
  weekId,
}: {
  slug: string;
  weekId: string;
}): Promise<{ smartList: SmartListData }> {
  console.log("[SmartList] generateSmartList start", { slug, weekId });
  const user = await requireWorkspaceUser(slug);

  const week = await prisma.shoppingListWeek.findFirst({
    where: { id: weekId, workspaceId: user.workspace.id },
  });

  if (!week) {
    console.log("[SmartList] week not found", { slug, weekId });
    throw new Error("Week not found");
  }

  const existing = await prisma.shoppingListSmart.findUnique({
    where: {
      workspaceId_weekId_version: {
        workspaceId: user.workspace.id,
        weekId: week.id,
        version: week.version,
      },
    },
    include: {
      items: {
        include: { provenance: true },
        orderBy: { sortKey: "asc" },
      },
    },
  });

  if (existing) {
    console.log("[SmartList] cache hit", {
      slug,
      weekId,
      version: week.version,
      smartListId: existing.id,
    });
    return { smartList: buildSmartListData(existing) };
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.log("[SmartList] missing OpenAI API key", { slug, weekId });
    throw new Error("Missing OpenAI API key");
  }
  const model = process.env.OPENAI_MODEL_SMARTLIST ?? "gpt-5-mini";
  const openAIStart = Date.now();
  console.log("[SmartList] OpenAI request start", {
    slug,
    weekId,
    model,
    version: week.version,
  });

  const weekStart = week.weekStart;
  const weekEnd = endOfWeek(weekStart);

  const planItems = await prisma.mealPlanItem.findMany({
    where: {
      workspaceId: user.workspace.id,
      date: {
        gte: weekStart,
        lte: weekEnd,
      },
    },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    include: {
      recipe: {
        select: {
          id: true,
          title: true,
          ingredientLines: {
            orderBy: { position: "asc" },
            select: {
              id: true,
              ingredient: true,
              position: true,
            },
          },
        },
      },
    },
  });

  const weekList: WeekList = {
    weekStart: formatDateISO(weekStart),
    title: "Shopping List",
    recipes: planItems.map((item) => ({
      id: item.recipe.id,
      title: item.recipe.title,
      photoUrl: null,
      ingredientLines: item.recipe.ingredientLines,
    })),
  };

  const aggregated = buildAggregatedSourceView(weekList);
  const flattenedItems = aggregated.flatMap((category) =>
    category.items.map((item) => ({
      categoryHint: category.label,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      notes: item.notes,
      display: item.display,
      sources: item.sources.map((source) => ({
        recipeId: source.recipeId,
        text: source.sourceText,
      })),
    })),
  );

  if (flattenedItems.length === 0) {
    console.log("[SmartList] no ingredients to normalize", { slug, weekId });
    throw new Error("No ingredients to normalize");
  }

  const allowedSources = new Map<string, string | null>();
  flattenedItems.forEach((item) => {
    item.sources.forEach((source) => {
      if (!allowedSources.has(source.text)) {
        allowedSources.set(source.text, source.recipeId ?? null);
      }
    });
  });

  const promptPayload = {
    weekStart: formatDateISO(weekStart),
    categories: SMART_LIST_CATEGORIES,
    items: flattenedItems,
  };

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: `${SYSTEM_PROMPT}\nReturn JSON with keys: categories (array) and notes (array).`,
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Use the provided items with provenance. JSON schema:\n{\n  "categories": [{"name": "Produce", "items": [{"name": "Carrots", "quantityValue": 500, "quantityUnit": "g", "isEstimated": false, "isMerged": true, "category": "Produce", "mergedFrom": ["2 carrots, chopped"]}]}],\n  "notes": ["..."]\n}\n\nInput:\n${JSON.stringify(promptPayload)}`,
            },
          ],
        },
      ],
      text: { format: { type: "json_object" } },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.log("[SmartList] OpenAI HTTP error", {
      slug,
      weekId,
      status: response.status,
      body: body.slice(0, 200),
    });
    throw new Error(`OpenAI error ${response.status}: ${body.slice(0, 200)}`);
  }

  const payload = (await response.json()) as OpenAIResponsePayload;
  const text = extractResponseText(payload);
  if (!text) {
    console.log("[SmartList] OpenAI missing output text", { slug, weekId });
    throw new Error("OpenAI response missing output text");
  }

  let parsed: SmartListLLMResponse;
  try {
    parsed = JSON.parse(text) as SmartListLLMResponse;
  } catch {
    throw new Error("Failed to parse OpenAI JSON");
  }

  if (!parsed || !Array.isArray(parsed.categories)) {
    console.log("[SmartList] OpenAI invalid response", { slug, weekId });
    throw new Error("Invalid OpenAI response");
  }

  const normalizedItems: Array<{
    category: string;
    displayText: string;
    quantityValue: number | null;
    quantityUnit: string | null;
    isEstimated: boolean;
    isMerged: boolean;
    sources: string[];
  }> = [];

  parsed.categories.forEach((category) => {
    if (!category || typeof category.name !== "string" || !Array.isArray(category.items)) {
      return;
    }
    const normalizedCategory = normalizeCategory(category.name);
    category.items.forEach((item) => {
      if (!item) {
        return;
      }
      const sourcesRaw = Array.isArray(item.mergedFrom)
        ? item.mergedFrom
        : Array.isArray(item.sources)
        ? item.sources
        : [];
      const sources = sourcesRaw
        .filter((source) => typeof source === "string")
        .map((source) => source.trim())
        .filter((source) => source && allowedSources.has(source));
      if (sources.length === 0) {
        return;
      }
      const displayTextCandidate =
        typeof item.displayText === "string"
          ? item.displayText
          : typeof item.name === "string"
          ? `${item.quantityValue ?? ""}${item.quantityUnit ? ` ${item.quantityUnit}` : ""} ${
              item.name
            }`.trim()
          : "";
      const displayText = sanitizeText(displayTextCandidate, 140);
      if (!displayText) return;
      normalizedItems.push({
        category: normalizedCategory,
        displayText,
        quantityValue:
          typeof item.quantityValue === "number" && !Number.isNaN(item.quantityValue)
            ? item.quantityValue
            : null,
        quantityUnit: typeof item.quantityUnit === "string" ? item.quantityUnit : null,
        isEstimated: Boolean(item.isEstimated),
        isMerged: Boolean(item.isMerged),
        sources,
      });
    });
  });

  if (normalizedItems.length === 0) {
    console.log("[SmartList] OpenAI returned no usable items", { slug, weekId });
    throw new Error("OpenAI returned no usable items");
  }
  console.log("[SmartList] OpenAI request finished", {
    slug,
    weekId,
    durationMs: Date.now() - openAIStart,
    itemCount: normalizedItems.length,
  });

  try {
    const writeStart = Date.now();
    console.log("[SmartList] db write start", {
      slug,
      weekId,
      version: week.version,
      itemCount: normalizedItems.length,
    });
    const smartListId = randomUUID();
    const itemRows = normalizedItems.map((item, index) => ({
      id: randomUUID(),
      smartListId,
      category: item.category,
      displayText: item.displayText,
      quantityValue: item.quantityValue,
      quantityUnit: item.quantityUnit,
      isEstimated: item.isEstimated,
      isMerged: item.isMerged,
      sortKey: index,
    }));
    const provenanceRows = itemRows.flatMap((itemRow, index) =>
      normalizedItems[index].sources.map((source) => ({
        id: randomUUID(),
        smartItemId: itemRow.id,
        sourceText: source,
        sourceRecipeId: allowedSources.get(source) ?? null,
      })),
    );

    const createSmartList = prisma.shoppingListSmart.create({
      data: {
        id: smartListId,
        workspaceId: user.workspace.id,
        weekId: week.id,
        version: week.version,
        model,
      },
    });
    const createItems = prisma.shoppingListSmartItem.createMany({
      data: itemRows,
    });
    const createProvenance = prisma.shoppingListSmartProvenance.createMany({
      data: provenanceRows,
    });

    await prisma.$transaction([createSmartList, createItems, createProvenance]);

    const smartList = await prisma.shoppingListSmart.findUnique({
      where: {
        workspaceId_weekId_version: {
          workspaceId: user.workspace.id,
          weekId: week.id,
          version: week.version,
        },
      },
      include: {
        items: {
          include: { provenance: true },
          orderBy: { sortKey: "asc" },
        },
      },
    });

    if (!smartList) {
      throw new Error("Smart list write failed");
    }

    console.log("[SmartList] db write finished", {
      slug,
      weekId,
      version: week.version,
      durationMs: Date.now() - writeStart,
      itemCount: smartList.items.length,
      provenanceCount: provenanceRows.length,
    });

    console.log("[SmartList] created", {
      slug,
      weekId,
      version: week.version,
      smartListId: smartList.id,
      itemCount: smartList.items.length,
      provenanceCount: provenanceRows.length,
      dbWriteDurationMs: Date.now() - writeStart,
    });
    return { smartList: buildSmartListData(smartList) };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const existingRecord = await prisma.shoppingListSmart.findUnique({
        where: {
          workspaceId_weekId_version: {
            workspaceId: user.workspace.id,
            weekId: week.id,
            version: week.version,
          },
        },
        include: {
          items: {
            include: { provenance: true },
            orderBy: { sortKey: "asc" },
          },
        },
      });
      if (existingRecord) {
        console.log("[SmartList] race cache hit", {
          slug,
          weekId,
          version: week.version,
          smartListId: existingRecord.id,
        });
        return { smartList: buildSmartListData(existingRecord) };
      }
    }
    console.log("[SmartList] failed", {
      slug,
      weekId,
      message: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
