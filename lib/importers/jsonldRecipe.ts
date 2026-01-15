import "server-only";

import { decodeHtmlEntities } from "@/lib/scrape/html";

export type NormalizedJsonLdRecipe = {
  title?: string;
  image?: string;
  recipeYield?: string | null;
  prepTimeMinutes?: number | null;
  cookTimeMinutes?: number | null;
  totalTimeMinutes?: number | null;
  ingredients?: string[];
  instructions?: string[];
};

export type HtmlFallbackRecipe = {
  title?: string;
  ingredients?: string[];
  instructions?: string[];
};

export function extractJsonLdFromHtml(html: string): unknown[] {
  const scripts: unknown[] = [];
  const regex =
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    const raw = match[1];
    if (!raw) continue;
    try {
      scripts.push(JSON.parse(raw));
    } catch {
      continue;
    }
  }
  return scripts;
}

export function parseJsonLdBlocks(blocks: string[]): unknown[] {
  const parsed: unknown[] = [];
  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;
    try {
      parsed.push(JSON.parse(trimmed));
    } catch {
      continue;
    }
  }
  return parsed;
}

function flattenJsonLd(node: unknown): unknown[] {
  if (!node) return [];
  if (Array.isArray(node)) {
    return node.flatMap((item) => flattenJsonLd(item));
  }
  if (typeof node === "object") {
    const graph = (node as Record<string, unknown>)["@graph"];
    if (graph) return flattenJsonLd(graph);
    return [node];
  }
  return [];
}

function isRecipeType(value: unknown) {
  if (!value) return false;
  if (Array.isArray(value)) {
    return value.some((item) => String(item).toLowerCase() === "recipe");
  }
  return String(value).toLowerCase() === "recipe";
}

function normalizeImageUrl(image: unknown): string | undefined {
  if (!image) return undefined;
  if (typeof image === "string") return image;
  if (Array.isArray(image)) {
    for (const entry of image) {
      const normalized = normalizeImageUrl(entry);
      if (normalized) return normalized;
    }
    return undefined;
  }
  if (typeof image === "object") {
    const imageObj = image as Record<string, unknown>;
    if (typeof imageObj.url === "string") return imageObj.url;
    if (typeof imageObj["@id"] === "string") return imageObj["@id"];
  }
  return undefined;
}

function parseDurationToMinutes(value?: string | null) {
  if (!value) return null;
  const match = value.match(/PT(?:(\d+)H)?(?:(\d+)M)?/i);
  if (!match) return null;
  const hours = match[1] ? Number(match[1]) : 0;
  const minutes = match[2] ? Number(match[2]) : 0;
  const total = hours * 60 + minutes;
  return Number.isNaN(total) ? null : total;
}

function normalizeRecipeYield(value: unknown): string | null {
  if (!value) return null;
  if (Array.isArray(value)) {
    const filtered = value
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean);
    return filtered.length > 0 ? filtered.join(", ") : null;
  }
  if (typeof value === "string") return value.trim() || null;
  return String(value);
}

function normalizeIngredientList(value: unknown): string[] | undefined {
  if (!value) return undefined;
  if (Array.isArray(value)) {
    return value
      .filter((item) => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  }
  return undefined;
}

function normalizeInstructionsToSteps(instructions: unknown): string[] | undefined {
  if (!instructions) return undefined;
  const lines: string[] = [];
  const pushLine = (line: string) => {
    const trimmed = line.trim();
    if (trimmed) lines.push(trimmed);
  };

  const handle = (item: unknown) => {
    if (!item) return;
    if (typeof item === "string") {
      pushLine(item);
      return;
    }
    if (Array.isArray(item)) {
      item.forEach(handle);
      return;
    }
    if (typeof item === "object") {
      const obj = item as Record<string, unknown>;
      if (typeof obj.text === "string") {
        handle(obj.text);
        return;
      }
      if (obj.itemListElement) {
        handle(obj.itemListElement);
        return;
      }
      if (obj.steps) {
        handle(obj.steps);
        return;
      }
      if (typeof obj.name === "string") {
        pushLine(obj.name);
      }
    }
  };

  handle(instructions);

  return lines.length > 0 ? lines : undefined;
}

export function extractRecipeFromJsonLd(
  jsonLd: unknown[],
): { recipe: NormalizedJsonLdRecipe | null; raw: unknown | null } {
  const nodes = jsonLd.flatMap((item) => flattenJsonLd(item));
  const recipeNode = nodes.find((node) =>
    isRecipeType((node as Record<string, unknown>)?.["@type"]),
  ) as Record<string, unknown> | undefined;
  if (!recipeNode) {
    return { recipe: null, raw: null };
  }

  const instructions = normalizeInstructionsToSteps(recipeNode.recipeInstructions);
  return {
    recipe: {
      title: typeof recipeNode.name === "string" ? recipeNode.name : undefined,
      image: normalizeImageUrl(recipeNode.image),
      recipeYield: normalizeRecipeYield(recipeNode.recipeYield),
      prepTimeMinutes: parseDurationToMinutes(
        typeof recipeNode.prepTime === "string" ? recipeNode.prepTime : undefined,
      ),
      cookTimeMinutes: parseDurationToMinutes(
        typeof recipeNode.cookTime === "string" ? recipeNode.cookTime : undefined,
      ),
      totalTimeMinutes: parseDurationToMinutes(
        typeof recipeNode.totalTime === "string" ? recipeNode.totalTime : undefined,
      ),
      ingredients: normalizeIngredientList(recipeNode.recipeIngredient),
      instructions,
    },
    raw: recipeNode,
  };
}

function stripTags(input: string) {
  return decodeHtmlEntities(input.replace(/<[^>]+>/g, " ").replace(/\s+/g, " "));
}

function extractTitleFromHtml(html: string): string | undefined {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch?.[1]) {
    const title = stripTags(titleMatch[1]).trim();
    if (title) return title;
  }
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1Match?.[1]) {
    const title = stripTags(h1Match[1]).trim();
    if (title) return title;
  }
  return undefined;
}

function extractListItems(html: string): string[] {
  const items = [...html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)];
  return items
    .map((match) => stripTags(match[1]))
    .map((item) => item.trim())
    .filter(Boolean);
}

function extractListAfterHeading(html: string, headingRegex: RegExp): string[] {
  const regex = new RegExp(
    `<h[1-6][^>]*>[^<]*${headingRegex.source}[^<]*<\\/h[1-6]>[\\s\\S]*?(<([ou]l)[^>]*>[\\s\\S]*?<\\/\\2>)`,
    "gi",
  );
  const match = regex.exec(html);
  if (!match?.[1]) return [];
  return extractListItems(match[1]);
}

export function extractRecipeFromHtmlFallback(html: string): HtmlFallbackRecipe {
  const title = extractTitleFromHtml(html);
  const ingredients = extractListAfterHeading(html, /ingredient/i);
  const instructions = extractListAfterHeading(html, /(instruction|method|direction|step)/i);

  return {
    title: title || undefined,
    ingredients: ingredients.length > 0 ? ingredients : undefined,
    instructions: instructions.length > 0 ? instructions : undefined,
  };
}
