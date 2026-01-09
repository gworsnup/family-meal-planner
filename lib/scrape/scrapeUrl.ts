import "server-only";

import { parseRecipeFromCaption } from "./parseCaption";
import { parseCaptionWithOpenAI } from "./parseCaptionWithOpenAI";
import { parseInstagramCaptionToRecipe } from "./parseInstagramCaption";
import { normalizeTikTokCaption, parseTikTokCaptionToRecipe } from "./parseTikTokCaption";
import { decodeHtmlEntities } from "./html";

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
      return decodeHtmlEntities(contentMatch[1].trim());
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

function findImageInObject(obj: any): string | null {
  let result: string | null = null;
  const visit = (value: any) => {
    if (!value || result) return;
    if (typeof value === "string") return;
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (typeof value === "object") {
      Object.entries(value).forEach(([key, val]) => {
        const lowered = key.toLowerCase();
        if (
          lowered.includes("display_url") ||
          lowered.includes("thumbnail_url") ||
          lowered.includes("image_url")
        ) {
          if (typeof val === "string") {
            result = val;
            return;
          }
        }
        visit(val);
      });
    }
  };

  visit(obj);
  return result;
}

function extractTikTokVideoId(url: string) {
  const match = url.match(/\/video\/(\d+)/);
  return match?.[1] ?? null;
}

function decodeJsonString(value: string) {
  try {
    return JSON.parse(`"${value.replace(/"/g, '\\"')}"`);
  } catch {
    return value;
  }
}

function normalizeUrl(value: string | null | undefined) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }
  if (!trimmed.startsWith("https://")) return null;
  if (trimmed.startsWith("data:") || trimmed.startsWith("blob:")) return null;
  return trimmed;
}

function findValueByKey(obj: any, key: string): string | null {
  if (!obj) return null;
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const found = findValueByKey(item, key);
      if (found) return found;
    }
    return null;
  }
  if (typeof obj === "object") {
    if (typeof obj[key] === "string") {
      return obj[key];
    }
    for (const value of Object.values(obj)) {
      const found = findValueByKey(value, key);
      if (found) return found;
    }
  }
  return null;
}

function extractTikTokImageUrl(html: string, url: string) {
  const preferredKeys = [
    "cover",
    "originCover",
    "dynamicCover",
    "shareCover",
    "thumbnail",
  ];
  const ogImage = getMetaContent(html, "og:image");
  const twitterImage = getMetaContent(html, "twitter:image");

  const sigiState = extractScriptById(html, "SIGI_STATE");
  if (sigiState) {
    try {
      const parsed = JSON.parse(sigiState);
      const itemModule = parsed?.ItemModule;
      const videoId = extractTikTokVideoId(url);
      const items = [
        videoId && itemModule?.[videoId] ? itemModule[videoId] : null,
        ...(itemModule ? Object.values(itemModule) : []),
      ].filter(Boolean);

      for (const item of items) {
        for (const key of preferredKeys) {
          const candidate = normalizeUrl(item?.video?.[key]);
          if (candidate) {
            return { url: candidate, source: `SIGI_STATE.${key}` };
          }
        }
      }
    } catch {
      // ignore JSON errors
    }
  }

  const universalData = extractScriptById(html, "__UNIVERSAL_DATA_FOR_REHYDRATION__");
  if (universalData) {
    try {
      const parsed = JSON.parse(universalData);
      const root = parsed?.__DEFAULT_SCOPE__ ?? parsed;
      for (const key of preferredKeys) {
        const candidate = findValueByKey(root, key);
        const normalized = normalizeUrl(candidate ?? undefined);
        if (normalized) {
          return { url: normalized, source: `rehydration.${key}` };
        }
      }
    } catch {
      // ignore JSON errors
    }
  }

  const normalizedOg = normalizeUrl(ogImage);
  if (normalizedOg) {
    return { url: normalizedOg, source: "meta.og:image" };
  }
  const normalizedTwitter = normalizeUrl(twitterImage);
  if (normalizedTwitter) {
    return { url: normalizedTwitter, source: "meta.twitter:image" };
  }

  const regex = /"(cover|originCover|dynamicCover|shareCover|thumbnail)":"(https?:\\\\\/\\\\\/[^"]+)"/g;
  const matches = [...html.matchAll(regex)];
  for (const match of matches) {
    const key = match[1];
    const decoded = decodeJsonString(match[2]);
    const normalized = normalizeUrl(decoded);
    if (normalized) {
      return { url: normalized, source: `regex.${key}` };
    }
  }

  return { url: null, source: null };
}

function extractTikTokCaptionFromHtml(html: string, url: string) {
  const ogDescription = getMetaContent(html, "og:description");
  const metaDescription = getMetaContent(html, "description");

  const extractItemCaption = (item: any) => {
    if (!item) return null;
    if (typeof item.desc === "string" && item.desc.trim()) return item.desc;
    if (typeof item.text === "string" && item.text.trim()) return item.text;
    if (typeof item.shareInfo?.desc === "string" && item.shareInfo.desc.trim()) {
      return item.shareInfo.desc;
    }
    return null;
  };

  const sigiState = extractScriptById(html, "SIGI_STATE");
  if (sigiState) {
    try {
      const parsed = JSON.parse(sigiState);
      const itemModule = parsed?.ItemModule;
      const videoId = extractTikTokVideoId(url);
      if (videoId && itemModule?.[videoId]) {
        const item = itemModule[videoId];
        const caption = extractItemCaption(item);
        if (caption) {
          return {
            caption: normalizeTikTokCaption(caption),
            source: "SIGI_STATE",
          };
        }
      }
      if (itemModule && typeof itemModule === "object") {
        for (const item of Object.values(itemModule)) {
          const caption = extractItemCaption(item);
          if (caption) {
            return {
              caption: normalizeTikTokCaption(caption),
              source: "SIGI_STATE",
            };
          }
        }
      }
    } catch {
      // ignore JSON errors
    }
  }

  const universalData = extractScriptById(html, "__UNIVERSAL_DATA_FOR_REHYDRATION__");
  if (universalData) {
    try {
      const parsed = JSON.parse(universalData);
      const matches: string[] = [];
      const visit = (value: any, key?: string) => {
        if (!value) return;
        if (typeof value === "string") {
          if (key && /(desc|caption|text)/i.test(key) && value.trim()) {
            matches.push(value);
          }
          return;
        }
        if (Array.isArray(value)) {
          value.forEach((item) => visit(item, key));
          return;
        }
        if (typeof value === "object") {
          Object.entries(value).forEach(([nextKey, nextValue]) => {
            visit(nextValue, nextKey);
          });
        }
      };
      visit(parsed?.__DEFAULT_SCOPE__ ?? parsed);
      const best = matches.sort((a, b) => b.length - a.length)[0];
      if (best) {
        return {
          caption: normalizeTikTokCaption(best),
          source: "__UNIVERSAL_DATA_FOR_REHYDRATION__",
        };
      }
    } catch {
      // ignore JSON errors
    }
  }

  if (ogDescription || metaDescription) {
    return {
      caption: normalizeTikTokCaption(ogDescription ?? metaDescription ?? ""),
      source: "meta",
    };
  }

  const regexMatches = [...html.matchAll(/\"desc\":\"(.*?)\"/g)];
  if (regexMatches.length > 0) {
    const decoded = regexMatches
      .map((match) => decodeJsonString(match[1]))
      .sort((a, b) => b.length - a.length)[0];
    if (decoded) {
      return {
        caption: normalizeTikTokCaption(decoded),
        source: "regex",
      };
    }
  }

  return { caption: null, source: null };
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

  if (hostname.includes("instagram.com")) {
    const sharedData = extractInlineScriptObject(html, "window\\._sharedData");
    if (sharedData) {
      const caption = findCaptionInObject(sharedData);
      if (caption) return decodeHtmlEntities(caption);
    }
  }

  return null;
}

function extractInstagramImage(html: string) {
  const sharedData = extractInlineScriptObject(html, "window\\._sharedData");
  if (!sharedData) return null;
  const image = findImageInObject(sharedData);
  return image ? decodeHtmlEntities(image) : null;
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

  if (hostname && hostname.includes("tiktok.com")) {
    const tiktokResult = extractTikTokCaptionFromHtml(html, resolvedUrl);
    const caption = tiktokResult.caption;
    const tiktokImage = extractTikTokImageUrl(html, resolvedUrl);
    if (caption) {
      const llmParsed = await parseCaptionWithOpenAI({
        captionText: caption,
        sourceDomain: "tiktok",
      });
      const parsed = parseTikTokCaptionToRecipe(caption);
      const llmDirections =
        llmParsed?.directions && llmParsed.directions.length > 0
          ? llmParsed.directions.join("\n")
          : undefined;
      const fallbackDescription =
        llmParsed?.description ??
        parsed.description ??
        (caption.slice(0, 240).trim() || baseResult.description);
      const title =
        llmParsed?.title ??
        parsed.title ??
        baseResult.title ??
        caption.split("\n").find(Boolean)?.slice(0, 80).trim();
      const shouldLogParser =
        process.env.SCRAPER_DEBUG === "1" || process.env.NODE_ENV !== "production";
      if (shouldLogParser) {
        console.log("TikTok caption parse", {
          extractionSource: tiktokResult.source,
          imageSource: tiktokImage.source,
          imageUrl: tiktokImage.url,
          captionLength: caption.length,
          ingredientCount:
            llmParsed?.ingredients.length ?? parsed.ingredients?.length ?? 0,
          directionsLength:
            llmDirections?.length ?? parsed.directions?.length ?? 0,
        });
      }
      return {
        ...baseResult,
        title,
        description: fallbackDescription,
        ingredients:
          llmParsed?.ingredients && llmParsed.ingredients.length > 0
            ? llmParsed.ingredients
            : parsed.ingredients ?? undefined,
        directions: llmDirections ?? parsed.directions ?? undefined,
        prepTimeMinutes: llmParsed?.prepTimeMinutes ?? baseResult.prepTimeMinutes,
        cookTimeMinutes: llmParsed?.cookTimeMinutes ?? baseResult.cookTimeMinutes,
        totalTimeMinutes: llmParsed?.totalTimeMinutes ?? baseResult.totalTimeMinutes,
        servings: llmParsed?.servings ?? baseResult.servings ?? null,
        yields: llmParsed?.yields ?? baseResult.yields ?? null,
        sourceName: "tiktok.com",
        sourceUrl: url,
        photoUrl: tiktokImage.url ?? baseResult.photoUrl ?? undefined,
        confidence:
          (llmParsed?.ingredients.length ?? parsed.ingredients?.length ?? 0) > 0 ||
          llmDirections ||
          parsed.directions
            ? "medium"
            : "low",
        raw: {
          ...baseResult.raw,
          caption,
          captionLength: caption.length,
          captionSource: tiktokResult.source,
          imageUrl: tiktokImage.url,
          imageSource: tiktokImage.source,
          llmParsed,
          parsed,
        },
      };
    }
    if (tiktokImage.url && !baseResult.photoUrl) {
      return {
        ...baseResult,
        photoUrl: tiktokImage.url,
        confidence: "low",
        raw: {
          ...baseResult.raw,
          imageUrl: tiktokImage.url,
          imageSource: tiktokImage.source,
        },
      };
    }
  }

  if (hostname && hostname.includes("instagram.com")) {
    const caption = extractCaptionFromHtml(html, hostname);
    const instagramImage = extractInstagramImage(html);
    if (caption) {
      const llmParsed = await parseCaptionWithOpenAI({
        captionText: caption,
        sourceDomain: "instagram",
      });
      const parsed = parseInstagramCaptionToRecipe(caption, baseResult.title);
      const shouldLogParser =
        process.env.SCRAPER_DEBUG === "1" || process.env.NODE_ENV !== "production";
      if (shouldLogParser) {
        console.log("Instagram caption parse", {
          extractedTitle: llmParsed?.title ?? parsed.title,
          descriptionLength:
            llmParsed?.description?.length ?? parsed.description?.length ?? 0,
          ingredientCount:
            llmParsed?.ingredients.length ?? parsed.ingredientLines?.length ?? 0,
          directionsLength:
            llmParsed?.directions.join("\n").length ??
            parsed.directionsText?.length ??
            0,
          titleHeuristic: parsed.titleHeuristic,
        });
      }
      return {
        ...baseResult,
        title: llmParsed?.title ?? parsed.title ?? baseResult.title,
        description:
          llmParsed?.description ?? parsed.description ?? baseResult.description,
        ingredients:
          llmParsed?.ingredients && llmParsed.ingredients.length > 0
            ? llmParsed.ingredients
            : parsed.ingredientLines && parsed.ingredientLines.length > 0
              ? parsed.ingredientLines.map((line) => line.ingredient)
              : undefined,
        directions:
          llmParsed?.directions && llmParsed.directions.length > 0
            ? llmParsed.directions.join("\n")
            : parsed.directionsText ?? undefined,
        prepTimeMinutes: llmParsed?.prepTimeMinutes ?? baseResult.prepTimeMinutes,
        cookTimeMinutes: llmParsed?.cookTimeMinutes ?? baseResult.cookTimeMinutes,
        totalTimeMinutes: llmParsed?.totalTimeMinutes ?? baseResult.totalTimeMinutes,
        servings: llmParsed?.servings ?? baseResult.servings ?? null,
        yields: llmParsed?.yields ?? baseResult.yields ?? null,
        sourceName: hostname,
        sourceUrl: url,
        photoUrl: baseResult.photoUrl ?? instagramImage ?? undefined,
        confidence:
          (llmParsed?.ingredients.length ?? parsed.ingredientLines?.length ?? 0) > 0
            ? "medium"
            : "low",
        raw: {
          ...baseResult.raw,
          caption,
          llmParsed,
          parsed,
        },
      };
    }
    if (instagramImage && !baseResult.photoUrl) {
      return {
        ...baseResult,
        photoUrl: instagramImage,
        confidence: "medium",
        raw: {
          ...baseResult.raw,
          instagramImage,
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
