import { parseInstagramCaptionToRecipe } from "./parseInstagramCaption";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function runTests() {
  const captionWithMarkers = `The #1 Recipe of 2025: Caramelized Onion and Garlic Spaghetti\n\nIngredients:\n- 1 large onion\n- 4 garlic cloves\n- 2 tbsp chili crisp\n\n1. Slice the onion thinly.\n2. Cook until golden.`;
  const parsedMarkers = parseInstagramCaptionToRecipe(captionWithMarkers);
  assert(
    parsedMarkers.ingredientsText?.includes("1 large onion") ?? false,
    "Expected ingredients section to parse.",
  );
  assert(
    parsedMarkers.directionsText?.startsWith("1.") ?? false,
    "Expected directions to start with steps.",
  );

  const captionNumbered = `Creamy pasta\n\n1. Boil water.\n2. Cook pasta.\n3. Toss with sauce.`;
  const parsedNumbered = parseInstagramCaptionToRecipe(captionNumbered);
  assert(
    parsedNumbered.directionsText?.startsWith("1.") ?? false,
    "Expected numbered steps to parse as directions.",
  );

  const captionHyphen = `Ingredients: - 1 onion - 2 cloves garlic - 1 tbsp olive oil`;
  const parsedHyphen = parseInstagramCaptionToRecipe(captionHyphen);
  assert(
    (parsedHyphen.ingredientLines?.length ?? 0) >= 3,
    "Expected hyphen-separated ingredients to split into lines.",
  );
}

if (process.env.RUN_INSTAGRAM_PARSER_TESTS) {
  runTests();
}
