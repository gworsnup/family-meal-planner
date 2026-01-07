export type CaptionParseResult = {
  ingredients: string[];
  directions: string | null;
  confidence: "high" | "medium" | "low";
};

const INGREDIENT_MARKERS = [
  "ingredients",
  "what you need",
  "you will need",
];
const DIRECTION_MARKERS = [
  "method",
  "instructions",
  "directions",
  "steps",
  "how to",
];

const QUANTITY_PREFIX =
  /^(\d+\s\d\/\d|\d+\/\d|\d+(\.\d+)?|½|¼|¾|⅓|⅔|⅛|⅜|⅝|⅞)\b/;
const UNIT_HINT =
  /\b(g|kg|ml|l|tsp|tbsp|teaspoon|tablespoon|cup|cups|oz|ounce|ounces|lb|pound|pounds)\b/i;
const VERB_HINT =
  /\b(mix|stir|bake|cook|heat|whisk|add|combine|serve|preheat|simmer|boil|roast|fry|saute|grill|blend|chop|slice|pour|toss)\b/i;

function normalizeCaption(caption: string) {
  return caption
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/-\s*(?=\d|½|¼|¾|⅓|⅔|⅛|⅜|⅝|⅞)/g, "\n- ")
    .replace(/(\s)(\d+\.)\s+/g, "\n$2 ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function cleanLine(line: string) {
  return line
    .replace(/^[\s•\-–—*]+/, "")
    .replace(/[•\-–—]+$/, "")
    .trim();
}

function isIngredientLine(line: string) {
  if (!line) return false;
  const trimmed = line.trim();
  if (QUANTITY_PREFIX.test(trimmed)) return true;
  return UNIT_HINT.test(trimmed);
}

function looksLikeDirection(line: string) {
  return VERB_HINT.test(line);
}

function findMarkerIndex(lines: string[], markers: string[]) {
  return lines.findIndex((line) =>
    markers.some((marker) => line.toLowerCase().includes(marker)),
  );
}

export function parseRecipeFromCaption(caption: string): CaptionParseResult {
  const normalized = normalizeCaption(caption);
  if (!normalized) {
    return { ingredients: [], directions: null, confidence: "low" };
  }

  const rawLines = normalized
    .split("\n")
    .map((line) => cleanLine(line))
    .filter((line) => line.length > 0);

  const ingredientMarkerIndex = findMarkerIndex(rawLines, INGREDIENT_MARKERS);
  const directionMarkerIndex = findMarkerIndex(rawLines, DIRECTION_MARKERS);

  if (ingredientMarkerIndex !== -1 && directionMarkerIndex !== -1) {
    const start = Math.min(ingredientMarkerIndex, directionMarkerIndex);
    const end = Math.max(ingredientMarkerIndex, directionMarkerIndex);
    if (ingredientMarkerIndex < directionMarkerIndex) {
      const ingredients = rawLines.slice(start + 1, end).filter(Boolean);
      const directions = rawLines.slice(end + 1).join("\n\n") || null;
      return {
        ingredients,
        directions,
        confidence: ingredients.length > 0 ? "high" : "medium",
      };
    }
  }

  if (ingredientMarkerIndex !== -1) {
    const ingredients: string[] = [];
    const directions: string[] = [];
    for (let i = ingredientMarkerIndex + 1; i < rawLines.length; i += 1) {
      const line = rawLines[i];
      if (!line) continue;
      if (ingredients.length > 0 && looksLikeDirection(line)) {
        directions.push(line, ...rawLines.slice(i + 1));
        break;
      }
      if (!isIngredientLine(line) && ingredients.length > 0) {
        directions.push(line, ...rawLines.slice(i + 1));
        break;
      }
      ingredients.push(line);
    }
    return {
      ingredients,
      directions: directions.length > 0 ? directions.join("\n\n") : null,
      confidence: ingredients.length > 0 ? "medium" : "low",
    };
  }

  const ingredients: string[] = [];
  const directions: string[] = [];
  let nonIngredientStreak = 0;
  rawLines.forEach((line) => {
    if (isIngredientLine(line) && nonIngredientStreak < 2) {
      ingredients.push(line);
      nonIngredientStreak = 0;
    } else {
      nonIngredientStreak += 1;
      directions.push(line);
    }
  });

  const ingredientConfidence =
    ingredients.length > 0 && ingredients.length >= directions.length / 2
      ? "medium"
      : "low";

  return {
    ingredients,
    directions: directions.length > 0 ? directions.join("\n\n") : null,
    confidence: ingredientConfidence,
  };
}

// Dev harness (manual): parseRecipeFromCaption(sampleCaption)
