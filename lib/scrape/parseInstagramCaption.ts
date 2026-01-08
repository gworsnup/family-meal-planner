export type InstagramIngredientLine = {
  ingredient: string;
};

export type InstagramCaptionParseResult = {
  title?: string;
  description?: string;
  ingredientLines?: InstagramIngredientLine[];
  directionsText?: string;
};

export function parseInstagramCaptionToRecipe(
  caption: string,
): InstagramCaptionParseResult {
  const lines = caption
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const ingredientLines: InstagramIngredientLine[] = [];
  const directions: string[] = [];
  let description: string | undefined;
  let title: string | undefined;
  let mode: "ingredients" | "directions" | "unknown" = "unknown";

  lines.forEach((line, index) => {
    if (index === 0) {
      title = line;
      return;
    }
    if (/^ingredients?:?/i.test(line)) {
      mode = "ingredients";
      return;
    }
    if (/^(directions?|instructions?|method):?/i.test(line)) {
      mode = "directions";
      return;
    }
    if (mode === "ingredients") {
      ingredientLines.push({ ingredient: line.replace(/^[-•]\s*/, "") });
      return;
    }
    if (mode === "directions") {
      directions.push(line.replace(/^[-•]\s*/, ""));
      return;
    }
    if (!description) {
      description = line;
    }
  });

  return {
    title,
    description,
    ingredientLines: ingredientLines.length > 0 ? ingredientLines : undefined,
    directionsText: directions.length > 0 ? directions.join("\n\n") : undefined,
  };
}
