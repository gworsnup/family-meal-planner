import { parseInstagramCaptionToRecipe } from "./parseInstagramCaption";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function runTests() {
  const melissaHemsleyCaption = `Golden Leek & Potato Soup\n\nIf you’re looking for a soothing bowl of soup while the weather shifts, this one is for you. I shared it in this week’s newsletter and it’s perfect for using up veg.\n\nIngredients\n2 tbsp olive oil\n2 big leeks, sliced\n2 large potatoes, peeled and diced\n3 cloves garlic, sliced\n750ml vegetable stock\nSea salt + black pepper\n\nMethod\n1. Heat the oil in a pan and soften the leeks and garlic.\n2. Add potatoes and stock, simmer for 20 minutes.\n3. Blend until smooth and season to taste.`;

  const benChelinCaption = `Recipe: Sticky Sesame Chicken\n\nWeeknight dinner with a glossy sauce that clings to every bite.\n\nIngredients:\n- 500g chicken thighs\n- 2 tbsp soy sauce\n- 1 tbsp honey\n- 1 tsp sesame oil\n\nDirections\n1) Sear chicken until golden.\n2) Add sauce and reduce.\n3) Top with sesame seeds.`;

  const parsedMelissa = parseInstagramCaptionToRecipe(melissaHemsleyCaption);
  const parsedBen = parseInstagramCaptionToRecipe(benChelinCaption);

  console.log("Melissa Hemsley parse:", parsedMelissa);
  console.log("Ben Chelin parse:", parsedBen);

  assert(
    parsedMelissa.title?.includes("Golden Leek") ?? false,
    "Expected dish title to be extracted from Melissa caption.",
  );
  assert(
    (parsedMelissa.ingredientLines?.length ?? 0) >= 5,
    "Expected ingredients to parse from Melissa caption.",
  );
  assert(
    parsedMelissa.directionsText?.startsWith("1.") ?? false,
    "Expected directions to parse from Melissa caption.",
  );
  assert(
    parsedBen.title?.includes("Sticky Sesame Chicken") ?? false,
    "Expected recipe title to parse from Ben caption.",
  );
}

if (process.env.RUN_INSTAGRAM_PARSER_TESTS) {
  runTests();
}
