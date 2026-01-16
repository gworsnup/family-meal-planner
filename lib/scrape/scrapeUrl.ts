import "server-only";

import {
  extractJsonLdFromHtml,
  extractRecipeFromHtmlFallback,
  extractRecipeFromJsonLd,
} from "@/lib/importers/jsonldRecipe";
import {
  fetchRecipeWithPlaywright,
  type PlaywrightFetchResult,
} from "@/lib/importers/playwrightFetcher";
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
  importMethod?: "fetch" | "playwright";
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

export type PlaywrightFetcher = (url: string) => Promise<PlaywrightFetchResult>;

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

function looksLikeAppShell(html: string) {
  const lowered = html.toLowerCase();
  if (
    lowered.includes("enable javascript") ||
    lowered.includes("please enable javascript") ||
    lowered.includes("requires javascript")
  ) {
    return true;
  }
  return /<noscript[\s\S]*?javascript[\s\S]*?<\/noscript>/i.test(html);
}

function parseHttpStatusFromError(error: unknown): number | null {
  const message = error instanceof Error ? error.message : String(error);
  const match = message.match(/HTTP\s(\d{3})/i);
  return match ? Number(match[1]) : null;
}

function buildMeta(html: string) {
  return {
    ogTitle: getMetaContent(html, "og:title"),
    ogImage: getMetaContent(html, "og:image"),
    ogDescription: getMetaContent(html, "og:description"),
    ogSiteName: getMetaContent(html, "og:site_name"),
    twitterTitle: getMetaContent(html, "twitter:title"),
    twitterImage: getMetaContent(html, "twitter:image"),
  };
}

function buildBaseResult({
  html,
  resolvedUrl,
  hostname,
  importMethod,
}: {
  html: string;
  resolvedUrl: string;
  hostname?: string;
  importMethod: "fetch" | "playwright";
}): { baseResult: ScrapeResult; meta: ReturnType<typeof buildMeta> } {
  const meta = buildMeta(html);
  return {
    baseResult: {
      title: meta.ogTitle ?? meta.twitterTitle,
      photoUrl: meta.ogImage ?? meta.twitterImage,
      description: meta.ogDescription,
      sourceUrl: resolvedUrl,
      sourceName: meta.ogSiteName ?? hostname,
      confidence: "medium",
      raw: { meta },
      importMethod,
    },
    meta,
  };
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

export async function scrapeRecipeWithPlaywright(
  url: string,
  playwrightFetcher: PlaywrightFetcher,
): Promise<ScrapeResult> {
  const shouldLogParser =
    process.env.SCRAPER_DEBUG === "1" || process.env.NODE_ENV !== "production";
  if (shouldLogParser) {
    console.log("Scrape fallback: playwright", { url });
  }

  try {
    const { html, finalUrl, jsonLd } = await playwrightFetcher(url);
    const resolvedUrl = finalUrl ?? url;
    const hostname = (() => {
      try {
        return new URL(resolvedUrl).hostname.replace(/^www\./, "");
      } catch {
        return undefined;
      }
    })();
    const { baseResult, meta } = buildBaseResult({
      html,
      resolvedUrl,
      hostname,
      importMethod: "playwright",
    });
    const { recipe: jsonLdRecipe, raw: recipeNode } = extractRecipeFromJsonLd(
      jsonLd,
    );

    if (jsonLdRecipe) {
      return {
        title: jsonLdRecipe.title,
        sourceUrl: resolvedUrl,
        sourceName: meta.ogSiteName ?? hostname,
        photoUrl: jsonLdRecipe.image,
        description: meta.ogDescription ?? baseResult.description,
        prepTimeMinutes: jsonLdRecipe.prepTimeMinutes,
        cookTimeMinutes: jsonLdRecipe.cookTimeMinutes,
        totalTimeMinutes: jsonLdRecipe.totalTimeMinutes,
        servings: jsonLdRecipe.recipeYield ?? null,
        yields: jsonLdRecipe.recipeYield ?? null,
        ingredients: jsonLdRecipe.ingredients ?? undefined,
        directions: jsonLdRecipe.instructions?.join("\n\n"),
        raw: {
          jsonLd: recipeNode,
          meta,
        },
        confidence: "high",
        importMethod: "playwright",
      };
    }

    const fallback = extractRecipeFromHtmlFallback(html);
    const hasFallbackData = Boolean(
      fallback.ingredients?.length || fallback.instructions?.length,
    );

    return {
      ...baseResult,
      title: fallback.title ?? baseResult.title,
      ingredients: fallback.ingredients ?? baseResult.ingredients,
      directions: fallback.instructions?.join("\n\n") ?? baseResult.directions,
      confidence: hasFallbackData ? "low" : baseResult.confidence,
      raw: {
        ...baseResult.raw,
        fallback,
      },
      importMethod: "playwright",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[Scrape] Playwright fallback failed", { url, message });
    throw new Error(`Playwright fallback failed: ${message}`);
  }
}

export async function scrapeUrl(
  url: string,
  options?: { playwrightFetcher?: PlaywrightFetcher },
): Promise<ScrapeResult> {
  const shouldLogParser =
    process.env.SCRAPER_DEBUG === "1" || process.env.NODE_ENV !== "production";
  if (shouldLogParser) {
    console.log("Scrape start", { url });
  }
  const playwrightFetcher = options?.playwrightFetcher ?? fetchRecipeWithPlaywright;
  let htmlResult: HtmlResult;
  try {
    htmlResult = await safeFetchHtml(url);
  } catch (error) {
    const status = parseHttpStatusFromError(error);
    if (status === 401 || status === 403) {
      if (shouldLogParser) {
        console.log("Scrape fallback due to status", { url, status });
      }
      return scrapeRecipeWithPlaywright(url, playwrightFetcher);
    }
    throw error;
  }

  const { html, finalUrl } = htmlResult;
  const resolvedUrl = finalUrl ?? url;
  const hostname = (() => {
    try {
      return new URL(resolvedUrl).hostname.replace(/^www\./, "");
    } catch {
      return undefined;
    }
  })();

  if (looksLikeAppShell(html)) {
    if (shouldLogParser) {
      console.log("Scrape fallback due to app shell", { url });
    }
    return scrapeRecipeWithPlaywright(url, playwrightFetcher);
  }

  if (shouldLogParser) {
    console.log("Scrape path: fetch", { url });
  }

  const { baseResult, meta } = buildBaseResult({
    html,
    resolvedUrl,
    hostname,
    importMethod: "fetch",
  });

  const { recipe: jsonLdRecipe, raw: recipeNode } = extractRecipeFromJsonLd(
    extractJsonLdFromHtml(html),
  );

  if (jsonLdRecipe) {
    return {
      title: jsonLdRecipe.title,
      sourceUrl: resolvedUrl,
      sourceName: meta.ogSiteName ?? hostname,
      photoUrl: jsonLdRecipe.image,
      description: meta.ogDescription ?? baseResult.description,
      prepTimeMinutes: jsonLdRecipe.prepTimeMinutes,
      cookTimeMinutes: jsonLdRecipe.cookTimeMinutes,
      totalTimeMinutes: jsonLdRecipe.totalTimeMinutes,
      servings: jsonLdRecipe.recipeYield ?? null,
      yields: jsonLdRecipe.recipeYield ?? null,
      ingredients: jsonLdRecipe.ingredients ?? undefined,
      directions: jsonLdRecipe.instructions?.join("\n\n"),
      raw: {
        jsonLd: recipeNode,
        meta,
      },
      confidence: "high",
      importMethod: "fetch",
    };
  }

  if (hostname && hostname.includes("tiktok.com")) {
    const tiktokResult = extractTikTokCaptionFromHtml(html, resolvedUrl);
    const caption = tiktokResult.caption;
    const tiktokImage = extractTikTokImageUrl(html, resolvedUrl);
    if (caption) {
      if (shouldLogParser) {
        console.log("TikTok LLM caption parse check", {
          hasApiKey: Boolean(process.env.OPENAI_API_KEY),
        });
      }
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
          llmUsed: Boolean(llmParsed),
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
      if (shouldLogParser) {
        console.log("Instagram LLM caption parse check", {
          hasApiKey: Boolean(process.env.OPENAI_API_KEY),
        });
      }
      const llmParsed = await parseCaptionWithOpenAI({
        captionText: caption,
        sourceDomain: "instagram",
      });
      const parsed = parseInstagramCaptionToRecipe(caption, baseResult.title);
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
          llmUsed: Boolean(llmParsed),
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
