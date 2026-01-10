"use server";

import "server-only";

import { cookies } from "next/headers";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { buildAggregatedSourceView, type WeekList } from "@/lib/ingredientParsing";
import { endOfWeek, formatDateISO } from "@/lib/planDates";
import type { SmartListData, SmartListItem } from "@/lib/smartListTypes";
import { SMART_LIST_CATEGORIES } from "@/lib/smartListConfig";
import { randomUUID } from "crypto";

const SYSTEM_PROMPT =
  "You are a precise shopping list normalizer.\n" +
  "You only return strict JSON that matches the schema.\n" +
  "Never invent ingredients. Only use the provided sources.\n" +
  "Only normalize, merge, or convert when confident.\n" +
  "If conversion is ambiguous, keep the original unit and mark isEstimated true.\n" +
  "Prefer metric (g/ml) when obvious (tbsp/tsp/ml, cups to ml for liquids).\n" +
  "Merge only obvious duplicates; otherwise keep separate.\n" +
  "Categories must be one of the provided category list.\n" +
  "Keep item text concise and user-facing.\n";

type SmartListLLMItem = {
  displayText: string;
  quantityValue?: number | null;
  quantityUnit?: string | null;
  isEstimated?: boolean;
  isMerged?: boolean;
  sources: string[];
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
  const cookieStore = await cookies();
  const authed = cookieStore.get(`wsp_${slug}`)?.value === "1";
  if (!authed) {
    console.log("[SmartList] unauthorized", { slug, weekId });
    throw new Error("Unauthorized");
  }

  const workspace = await prisma.workspace.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!workspace) {
    console.log("[SmartList] workspace not found", { slug, weekId });
    throw new Error("Workspace not found");
  }

  const week = await prisma.shoppingListWeek.findFirst({
    where: { id: weekId, workspaceId: workspace.id },
  });

  if (!week) {
    console.log("[SmartList] week not found", { slug, weekId });
    throw new Error("Week not found");
  }

  const existing = await prisma.shoppingListSmart.findUnique({
    where: {
      workspaceId_weekId_version: {
        workspaceId: workspace.id,
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
  const model = process.env.OPENAI_MODEL_SMARTLIST ?? "gpt-5-nano";
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
      workspaceId: workspace.id,
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
              text: `Use the provided items with provenance. JSON schema:\n{\n  "categories": [{"name": "Produce", "items": [{"displayText": "Carrots — 500 g", "quantityValue": 500, "quantityUnit": "g", "isEstimated": false, "isMerged": true, "sources": ["2 carrots, chopped"]}]}],\n  "notes": ["..."]\n}\n\nInput:\n${JSON.stringify(promptPayload)}`,
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
      if (!item || typeof item.displayText !== "string" || !Array.isArray(item.sources)) {
        return;
      }
      const displayText = sanitizeText(item.displayText, 140);
      if (!displayText) return;
      const sources = item.sources
        .filter((source) => typeof source === "string")
        .map((source) => source.trim())
        .filter((source) => source && allowedSources.has(source));
      if (sources.length === 0) {
        return;
      }
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
        workspaceId: workspace.id,
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
          workspaceId: workspace.id,
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
            workspaceId: workspace.id,
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
