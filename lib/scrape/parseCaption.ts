export type CaptionParseResult = {
  ingredients: string[];
  directions?: string;
  confidence: "low" | "medium" | "high";
};

const INGREDIENT_HEADING = /^ingredients?:?/i;
const DIRECTION_HEADING = /^(directions?|instructions?|method):?/i;

export function parseRecipeFromCaption(text: string): CaptionParseResult {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const ingredients: string[] = [];
  const directions: string[] = [];
  let mode: "ingredients" | "directions" | "unknown" = "unknown";

  lines.forEach((line) => {
    if (INGREDIENT_HEADING.test(line)) {
      mode = "ingredients";
      return;
    }
    if (DIRECTION_HEADING.test(line)) {
      mode = "directions";
      return;
    }
    if (mode === "ingredients") {
      ingredients.push(line.replace(/^[-•]\s*/, ""));
    } else if (mode === "directions") {
      directions.push(line.replace(/^[-•]\s*/, ""));
    }
  });

  const confidence =
    ingredients.length > 0 && directions.length > 0 ? "medium" : "low";

  return {
    ingredients,
    directions: directions.length > 0 ? directions.join("\n\n") : undefined,
    confidence,
  };
}
