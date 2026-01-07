import "server-only";

import { parseRecipeFromCaption } from "./parseCaption";

export type ScrapeResult = {
  title?: string;
  sourceUrl?: string;
  sourceName?: string;
  photoUrl?: string;
  description?: string;
  prepTimeMinutes?: number | null;
  cookTimeMinutes?: number | null;
  totalTimeMinutes?: number | null;
  servings?: string | null;
  yields?: string | null;
  ingredients?: string[];
  directions?: string;
  raw?: any;
  confidence: "high" | "medium" | "low";
};

const MAX_RESPONSE_BYTES = 4 * 1024 * 1024;
const MAX_REDIRECTS = 5;
const REQUEST_TIMEOUT_MS = 15_000;
const USER_AGENT =
  "Mozilla/5.0 (compatible; FamilyMealPlannerBot/1.0; +https://familymealplanner.app)";

type HtmlResult = {
  finalUrl: string;
  html: string;
};

async function readResponseBody(
  response: Response,
  limit: number,
): Promise<string> {
  if (!response.body) {
    throw new Error("Empty response body");
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      received += value.length;
      if (received > limit) {
        throw new Error("Response too large");
      }
      chunks.push(value);
    }
  }

  const decoder = new TextDecoder("utf-8");
  const merged = new Uint8Array(received);
  let offset = 0;
  chunks.forEach((chunk) => {
    merged.set(chunk, offset);
    offset += chunk.length;
  });
  return decoder.decode(merged);
}

export async function safeFetchHtml(url: string): Promise<HtmlResult> {
  let currentUrl = url;

  for (let i = 0; i < MAX_REDIRECTS; i += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    let response: Response;
    try {
      response = await fetch(currentUrl, {
        redirect: "manual",
        signal: controller.signal,
        cache: "no-store",
        headers: {
          "user-agent": USER_AGENT,
          accept: "text/html,application/xhtml+xml",
        },
      });
    } finally {
      clearTimeout(timeout);
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) {
        throw new Error("Redirect without location");
      }
      currentUrl = new URL(location, currentUrl).toString();
      continue;
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await readResponseBody(response, MAX_RESPONSE_BYTES);
    return { finalUrl: currentUrl, html };
  }

  throw new Error("Too many redirects");
}

function getMetaContent(html: string, key: string) {
  const regex = new RegExp(
    `<meta[^>]+(?:property|name)=["']${key}["'][^>]*>`,
    "gi",
  );
  const matches = html.match(regex) ?? [];
  for (const match of matches) {
    const contentMatch = match.match(/content=["']([^"']*)["']/i);
    if (contentMatch?.[1]) {
      return contentMatch[1].trim();
    }
  }
  return undefined;
}

function extractJsonLd(html: string) {
  const scripts: any[] = [];
  const regex =
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    const raw = match[1];
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      scripts.push(parsed);
    } catch {
      continue;
    }
  }
  return scripts;
}

function flattenJsonLd(node: any): any[] {
  if (!node) return [];
  if (Array.isArray(node)) {
    return node.flatMap((item) => flattenJsonLd(item));
  }
  if (typeof node === "object") {
    const graph = node["@graph"];
    if (graph) {
      return flattenJsonLd(graph);
    }
    return [node];
  }
  return [];
}

function isRecipeType(value: any) {
  if (!value) return false;
  if (Array.isArray(value)) {
    return value.some((item) => String(item).toLowerCase() === "recipe");
  }
  return String(value).toLowerCase() === "recipe";
}

function normalizeImageUrl(image: any): string | undefined {
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
    if (typeof image.url === "string") return image.url;
    if (typeof image["@id"] === "string") return image["@id"];
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

function normalizeInstructions(instructions: any): string | undefined {
  if (!instructions) return undefined;
  const lines: string[] = [];
  const pushLine = (line: string) => {
    const trimmed = line.trim();
    if (trimmed) lines.push(trimmed);
  };

  const handle = (item: any) => {
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
      if (item.text) {
        handle(item.text);
        return;
      }
      if (item.itemListElement) {
        handle(item.itemListElement);
        return;
      }
      if (item.name) {
        pushLine(item.name);
        return;
      }
    }
  };

  handle(instructions);

  if (lines.length === 0) return undefined;
  return lines.join("\n\n");
}

function htmlToText(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, "\n")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractScriptById(html: string, id: string) {
  const regex = new RegExp(
    `<script[^>]*id=["']${id}["'][^>]*>([\\s\\S]*?)<\\/script>`,
    "i",
  );
  const match = html.match(regex);
  return match?.[1] ?? null;
}

function extractInlineScriptObject(html: string, marker: string) {
  const regex = new RegExp(`${marker}\\s*=\\s*(\\{[\\s\\S]*?\\});`);
  const match = html.match(regex);
  if (!match?.[1]) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

function findCaptionInObject(obj: any): string | null {
  let best: string | null = null;
  const visit = (value: any) => {
    if (!value) return;
    if (typeof value === "string") {
      if (!best || value.length > best.length) {
        best = value;
      }
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (typeof value === "object") {
      Object.entries(value).forEach(([key, val]) => {
        const lowered = key.toLowerCase();
        if (
          lowered.includes("caption") ||
          lowered.includes("description") ||
          lowered.includes("desc") ||
          lowered.includes("text")
        ) {
          visit(val);
        } else {
          visit(val);
        }
      });
    }
  };

  visit(obj);
  return best;
}

function extractCaptionFromHtml(html: string, hostname: string) {
  const ogDescription = getMetaContent(html, "og:description");
  const metaDescription = getMetaContent(html, "description");
  if (ogDescription && ogDescription.length > 0) {
    return ogDescription;
  }
  if (metaDescription && metaDescription.length > 0) {
    return metaDescription;
  }

  if (hostname.includes("tiktok.com")) {
    const sigiState = extractScriptById(html, "SIGI_STATE");
    if (sigiState) {
      try {
        const parsed = JSON.parse(sigiState);
        const caption = findCaptionInObject(parsed);
        if (caption) return caption;
      } catch {
        return null;
      }
    }
  }

  if (hostname.includes("instagram.com")) {
    const sharedData = extractInlineScriptObject(html, "window\\._sharedData");
    if (sharedData) {
      const caption = findCaptionInObject(sharedData);
      if (caption) return caption;
    }
  }

  return null;
}

export async function scrapeUrl(url: string): Promise<ScrapeResult> {
  const { html, finalUrl } = await safeFetchHtml(url);
  const resolvedUrl = finalUrl ?? url;
  const hostname = (() => {
    try {
      return new URL(resolvedUrl).hostname.replace(/^www\./, "");
    } catch {
      return undefined;
    }
  })();

  const rawJsonLd = extractJsonLd(html);
  const jsonLdObjects = rawJsonLd.flatMap((item) => flattenJsonLd(item));
  const recipeNode = jsonLdObjects.find((node) => isRecipeType(node["@type"]));

  const meta = {
    ogTitle: getMetaContent(html, "og:title"),
    ogImage: getMetaContent(html, "og:image"),
    ogDescription: getMetaContent(html, "og:description"),
    ogSiteName: getMetaContent(html, "og:site_name"),
    twitterTitle: getMetaContent(html, "twitter:title"),
    twitterImage: getMetaContent(html, "twitter:image"),
  };

  if (recipeNode) {
    const instructions = normalizeInstructions(recipeNode.recipeInstructions);
    return {
      title: recipeNode.name,
      sourceUrl: resolvedUrl,
      sourceName: meta.ogSiteName ?? hostname,
      photoUrl: normalizeImageUrl(recipeNode.image),
      description: recipeNode.description ?? meta.ogDescription,
      prepTimeMinutes: parseDurationToMinutes(recipeNode.prepTime),
      cookTimeMinutes: parseDurationToMinutes(recipeNode.cookTime),
      totalTimeMinutes: parseDurationToMinutes(recipeNode.totalTime),
      servings: recipeNode.recipeYield ? String(recipeNode.recipeYield) : null,
      yields: recipeNode.recipeYield ? String(recipeNode.recipeYield) : null,
      ingredients: recipeNode.recipeIngredient ?? undefined,
      directions: instructions,
      raw: {
        jsonLd: recipeNode,
        meta,
      },
      confidence: "high",
    };
  }

  const baseResult: ScrapeResult = {
    title: meta.ogTitle ?? meta.twitterTitle,
    photoUrl: meta.ogImage ?? meta.twitterImage,
    description: meta.ogDescription,
    sourceUrl: resolvedUrl,
    sourceName: meta.ogSiteName ?? hostname,
    confidence: "medium",
    raw: {
      meta,
    },
  };

  if (hostname && (hostname.includes("tiktok.com") || hostname.includes("instagram.com"))) {
    const caption = extractCaptionFromHtml(html, hostname);
    if (caption) {
      const parsed = parseRecipeFromCaption(caption);
      return {
        ...baseResult,
        description: caption,
        ingredients: parsed.ingredients.length > 0 ? parsed.ingredients : undefined,
        directions: parsed.directions ?? undefined,
        confidence: parsed.confidence === "low" ? "low" : "medium",
        raw: {
          ...baseResult.raw,
          caption,
          parsed,
        },
      };
    }
  }

  const text = htmlToText(html);
  const parsedFallback = parseRecipeFromCaption(text);
  if (parsedFallback.ingredients.length > 0 || parsedFallback.directions) {
    return {
      ...baseResult,
      ingredients:
        parsedFallback.ingredients.length > 0 ? parsedFallback.ingredients : undefined,
      directions: parsedFallback.directions ?? undefined,
      confidence: "low",
      raw: {
        ...baseResult.raw,
        parsedFallback,
      },
    };
  }

  return baseResult;
}
