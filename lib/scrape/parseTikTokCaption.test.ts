import { parseTikTokCaptionToRecipe } from "./parseTikTokCaption";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function runTests() {
  const sampleCaption = `Creamy tomato orzo 🥣\n\nCozy weeknight dinner that comes together fast.\n\nIngredients:\n- 1 tbsp olive oil\n- 2 cloves garlic, minced\n- 1 cup orzo\n- 1 can crushed tomatoes\n- 2 cups veggie broth\n- 1/2 cup cream\n\nMethod\n1. Sauté garlic in olive oil.\n2. Stir in orzo and toast for 2 minutes.\n3. Add tomatoes + broth, simmer until tender.\n4. Finish with cream and season.`;

  const parsed = parseTikTokCaptionToRecipe(sampleCaption);

  console.log("TikTok caption parse:", parsed);

  assert(
    parsed.title?.includes("Creamy tomato orzo") ?? false,
    "Expected title to parse from TikTok caption.",
  );
  assert(
    (parsed.ingredients?.length ?? 0) >= 5,
    "Expected ingredients to parse from TikTok caption.",
  );
  assert(
    parsed.directions?.startsWith("1.") ?? false,
    "Expected directions to parse from TikTok caption.",
  );
  assert(
    parsed.description?.includes("Cozy weeknight") ?? false,
    "Expected description to parse from TikTok caption.",
  );
}

if (process.env.RUN_TIKTOK_PARSER_TESTS) {
  runTests();
}
