import "server-only";

import chromium from "@sparticuz/chromium";
import { chromium as pwChromium } from "playwright-core";

import { parseJsonLdBlocks } from "@/lib/importers/jsonldRecipe";

export type PlaywrightFetchResult = {
  finalUrl: string;
  html: string;
  jsonLd: unknown[];
};

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
      finalUrl: page.url(),
      html,
      jsonLd: parseJsonLdBlocks(jsonLdBlocks),
    };
  } finally {
    await page.close().catch(() => null);
    await context.close().catch(() => null);
    await browser.close().catch(() => null);
  }
}
