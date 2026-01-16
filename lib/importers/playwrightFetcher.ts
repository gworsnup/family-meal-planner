import "server-only";

import chromium from "@sparticuz/chromium";
import { chromium as pwChromium } from "playwright-core";

import { parseJsonLdBlocks } from "@/lib/importers/jsonldRecipe";

export type PlaywrightFetchResult = {
  finalUrl: string;
  html: string;
  jsonLd: unknown[];
};

export class PlaywrightBlockedError extends Error {
  finalUrl: string;
  pageTitle: string;

  constructor(details: { finalUrl: string; pageTitle: string }) {
    super("Playwright blocked by site protections");
    this.name = "PlaywrightBlockedError";
    this.finalUrl = details.finalUrl;
    this.pageTitle = details.pageTitle;
  }
}

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export async function fetchRecipeWithPlaywright(
  url: string,
): Promise<PlaywrightFetchResult> {
  const executablePath = await chromium.executablePath();
  const browser = await pwChromium.launch({
    executablePath: executablePath ?? undefined,
    args: chromium.args,
    headless: chromium.headless === "shell" ? false : chromium.headless,
  });

  const context = await browser.newContext({
    userAgent: USER_AGENT,
    locale: "en-GB",
    extraHTTPHeaders: {
      "Accept-Language": "en-GB,en;q=0.9",
    },
  });

  const page = await context.newPage();
  page.setDefaultTimeout(30_000);
  page.setDefaultNavigationTimeout(30_000);

  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });
    await page.waitForTimeout(1_000);
    const pageTitle = await page.title();
    const finalUrl = page.url();
    const bodyTextSample = await page.evaluate(
      () => document.body?.innerText?.slice(0, 3000) ?? "",
    );
    const loweredTitle = pageTitle.toLowerCase();
    const loweredBody = bodyTextSample.toLowerCase();
    const loweredUrl = finalUrl.toLowerCase();
    const blocked =
      loweredTitle.includes("access denied") ||
      loweredTitle.includes("forbidden") ||
      loweredBody.includes("access denied") ||
      loweredBody.includes("you don't have permission") ||
      loweredBody.includes("reference #") ||
      loweredBody.includes("request id") ||
      loweredBody.includes("akamai") ||
      loweredUrl.includes("accessdenied") ||
      loweredUrl.includes("forbidden");
    if (blocked) {
      throw new PlaywrightBlockedError({ finalUrl, pageTitle });
    }
    const jsonLdBlocks = await page.$$eval(
      'script[type="application/ld+json"]',
      (elements) =>
        elements
          .map((element) => element.textContent ?? "")
          .map((text) => text.trim())
          .filter(Boolean),
    );
    const html = await page.content();
    return {
      finalUrl,
      html,
      jsonLd: parseJsonLdBlocks(jsonLdBlocks),
    };
  } finally {
    await page.close().catch(() => null);
    await context.close().catch(() => null);
    await browser.close().catch(() => null);
  }
}
