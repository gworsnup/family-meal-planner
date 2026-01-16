import { scrapeRecipeWithPlaywright } from "./scrapeUrl";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

async function runTests() {
  const recipeJsonLd = {
    "@type": "Recipe",
    name: "Mock Recipe",
    recipeIngredient: ["1 egg"],
    recipeInstructions: ["Cook the egg."],
  };

  const mockFetcher = async () => ({
    finalUrl: "https://example.com/recipe",
    html: `<html><head><title>Mock Recipe</title></head><body></body></html>`,
    jsonLd: [recipeJsonLd],
  });

  const result = await scrapeRecipeWithPlaywright(
    "https://example.com/recipe",
    mockFetcher,
  );

  assert(result.importMethod === "playwright", "Expected playwright import method.");
  assert(result.title === "Mock Recipe", "Expected JSON-LD title to parse.");
  assert(
    result.directions?.includes("Cook the egg.") ?? false,
    "Expected instructions to parse from JSON-LD.",
  );
}

if (process.env.RUN_PLAYWRIGHT_FALLBACK_TESTS) {
  void runTests();
}
