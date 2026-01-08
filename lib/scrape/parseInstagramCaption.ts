import { decodeHtmlEntities } from "./html";

export type InstagramParseResult = {
  title?: string | null;
  description?: string | null;
  ingredientsText?: string | null;
  directionsText?: string | null;
  ingredientLines?: { position: number; ingredient: string }[];
};

const INGREDIENT_MARKER = /(ingredients|ingredient|what you need|you['’]ll need)\s*:/i;
const DIRECTION_MARKER = /(instructions|directions|method|steps|how to)\s*:/i;
const STEP_MARKER = /^\s*(\d+[.)]|step\s*\d+)/i;
const MEASURE_HINT =
  /\b(\d+\/\d|\d+\s?\/\s?\d|\d+|\b½\b|\b¼\b|\b¾\b|\b⅓\b|\b⅔\b|\b⅛\b|\b⅜\b|\b⅝\b|\b⅞\b)\s?(tsp|tbsp|cup|cups|g|kg|ml|l|oz|lb|cloves?)\b/i;

function normalizeCaptionText(value: string) {
  return decodeHtmlEntities(value)
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function isLikelyTitle(line: string) {
  if (!line) return false;
  if (line.length > 80) return false;
  if (INGREDIENT_MARKER.test(line) || DIRECTION_MARKER.test(line)) return false;
  if (STEP_MARKER.test(line)) return false;
  return true;
}

function splitIngredientLines(text: string | null) {
  if (!text) return [];
  const hyphenCount = (text.match(/\s-\s/g) ?? []).length;
  const normalized =
    hyphenCount >= 2 ? text.replace(/\s*-\s+/g, "\n") : text;
  return normalized
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function parseInstagramCaptionToRecipe(
  captionText: string,
): InstagramParseResult {
  const normalized = normalizeCaptionText(captionText);
  if (!normalized) {
    return {
      title: null,
      description: null,
      ingredientsText: null,
      directionsText: null,
      ingredientLines: [],
    };
  }

  const lines = normalized.split("\n").map((line) => line.trim());
  const firstLine = lines.find((line) => line.length > 0) ?? "";
  let title: string | null = null;
  if (isLikelyTitle(firstLine)) {
    title = firstLine;
  } else {
    const beforeIngredients = normalized.split(INGREDIENT_MARKER)[0]?.trim();
    const firstSentence = beforeIngredients
      ?.split(/[\n.!?]/)
      .find((line) => line.trim().length > 0)
      ?.trim();
    if (firstSentence && firstSentence.length <= 80) {
      title = firstSentence;
    }
  }

  const ingredientIndex = lines.findIndex((line) => INGREDIENT_MARKER.test(line));
  const directionIndex = lines.findIndex((line) => DIRECTION_MARKER.test(line));

  let ingredientsText: string | null = null;
  let directionsText: string | null = null;
  let description: string | null = null;

  if (ingredientIndex !== -1 && directionIndex !== -1 && ingredientIndex < directionIndex) {
    ingredientsText = lines
      .slice(ingredientIndex + 1, directionIndex)
      .join("\n")
      .trim() || null;
    directionsText = lines.slice(directionIndex + 1).join("\n").trim() || null;
    description = normalized.split(lines[ingredientIndex])[0]?.trim() || null;
  } else if (ingredientIndex !== -1) {
    const afterIngredients = lines.slice(ingredientIndex + 1);
    const stepIndex = afterIngredients.findIndex((line) => STEP_MARKER.test(line));
    if (stepIndex !== -1) {
      ingredientsText = afterIngredients.slice(0, stepIndex).join("\n").trim() || null;
      directionsText = afterIngredients.slice(stepIndex).join("\n").trim() || null;
    } else {
      ingredientsText = afterIngredients.join("\n").trim() || null;
    }
    description = normalized.split(lines[ingredientIndex])[0]?.trim() || null;
  } else {
    const stepLineIndex = lines.findIndex((line) => STEP_MARKER.test(line));
    if (stepLineIndex !== -1) {
      const beforeSteps = lines.slice(0, stepLineIndex).join("\n").trim();
      description = beforeSteps || null;
      directionsText = lines.slice(stepLineIndex).join("\n").trim() || null;
      const ingredientCandidates = lines
        .slice(0, stepLineIndex)
        .filter(
          (line) =>
            line.startsWith("-") ||
            line.startsWith("•") ||
            MEASURE_HINT.test(line),
        );
      if (ingredientCandidates.length > 0) {
        ingredientsText = ingredientCandidates.join("\n").trim() || null;
      }
    } else {
      directionsText = normalized;
    }
  }

  if (!description && normalized.includes("\n\n")) {
    const firstParagraph = normalized.split("\n\n")[0]?.trim();
    if (firstParagraph && !INGREDIENT_MARKER.test(firstParagraph)) {
      description = firstParagraph;
    }
  }

  const ingredientLines = splitIngredientLines(ingredientsText).map(
    (ingredient, index) => ({
      position: index + 1,
      ingredient,
    }),
  );

  return {
    title,
    description,
    ingredientsText,
    directionsText,
    ingredientLines,
  };
}
