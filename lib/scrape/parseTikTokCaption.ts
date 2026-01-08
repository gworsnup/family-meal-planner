import { decodeHtmlEntities } from "./html";

export type ParsedRecipe = {
  title?: string;
  description?: string;
  ingredients?: string[];
  directions?: string;
  yields?: string | null;
  servings?: string | null;
  totalTimeMinutes?: number | null;
};

const TITLE_MAX_CHARS = 80;
const CTA_PATTERNS =
  /link in bio|follow|comment|recipe in caption|recipe in comments|subscribe|dm|bio|discount|code|shop|giveaway/i;
const BULLET_PATTERN = /^[-•–*]/;
const EMOJI_BULLET_PATTERN = /^[\p{Extended_Pictographic}\p{Emoji_Presentation}]/u;
const FRACTION_PATTERN = /^[\d\s/¼½¾⅓⅔⅛⅜⅝⅞]+/;
const DIRECTIONS_VERBS =
  /^(mix|stir|bake|heat|add|cook|combine|whisk|saute|sauté|fry|roast|boil|simmer|serve|pour|blend|chop|slice|marinate|grill|preheat|toss|season|fold|whip|assemble)\b/i;

export function normalizeTikTokCaption(caption: string) {
  let normalized = decodeHtmlEntities(caption);
  normalized = normalized.replace(/\r\n/g, "\n");
  normalized = normalized.replace(/\\n/g, "\n");
  normalized = normalized.replace(/\t/g, " ");
  normalized = normalized.replace(/[ ]{2,}/g, " ");
  normalized = normalized.replace(/\n{3,}/g, "\n\n");
  normalized = stripTrailingHashtags(normalized);
  return normalized.trim();
}

function stripTrailingHashtags(text: string) {
  const trimmed = text.trim();
  if (trimmed.length < 40) return trimmed;

  const startIndex = Math.floor(trimmed.length * 0.7);
  const tail = trimmed.slice(startIndex);
  const hashtags = tail.match(/#[\w\d_]+/g) ?? [];
  const hashtagChars = hashtags.reduce((sum, tag) => sum + tag.length, 0);
  const nonSpaceChars = tail.replace(/\s/g, "").length;

  if (nonSpaceChars > 0 && hashtagChars / nonSpaceChars > 0.6) {
    const firstHash = trimmed.indexOf("#", startIndex);
    if (firstHash > -1) {
      return trimmed.slice(0, firstHash).trim();
    }
  }

  return trimmed;
}

function isIngredientHeading(line: string) {
  return /^(ingredients\b|what you need\b|you(?:'|’)ll need\b)/i.test(line);
}

function isDirectionsHeading(line: string) {
  return /^(method|directions|instructions|steps|how to)\b[:\-]?/i.test(line);
}

function isNumberedStep(line: string) {
  return /^(\d+[\).\s]|step\s*\d+)/i.test(line);
}

function isIngredientLine(line: string) {
  if (!line) return false;
  if (isNumberedStep(line)) return false;
  if (BULLET_PATTERN.test(line) || EMOJI_BULLET_PATTERN.test(line)) return true;
  if (FRACTION_PATTERN.test(line)) return true;
  return false;
}

function isStepLine(line: string) {
  if (!line) return false;
  if (isNumberedStep(line)) return true;
  return DIRECTIONS_VERBS.test(line);
}

function stripBullet(line: string) {
  if (BULLET_PATTERN.test(line)) {
    return line.replace(BULLET_PATTERN, "").trim();
  }
  return line.trim();
}

function extractIngredientsBlock(lines: string[]) {
  let startIndex: number | null = null;
  let foundHeading = false;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line) continue;
    if (isIngredientHeading(line)) {
      startIndex = i;
      foundHeading = true;
      break;
    }
    if (isIngredientLine(line)) {
      startIndex = i;
      break;
    }
  }

  if (startIndex === null) {
    return { ingredients: [], startIndex: null, endIndex: null };
  }

  const ingredients: string[] = [];
  let i = startIndex;
  if (foundHeading) {
    i += 1;
  }

  for (; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line) {
      const nextLine = lines.slice(i + 1).find((item) => item.trim());
      if (nextLine && (isDirectionsHeading(nextLine) || isNumberedStep(nextLine))) {
        break;
      }
      continue;
    }
    if (isDirectionsHeading(line) || isNumberedStep(line)) {
      break;
    }
    if (foundHeading || isIngredientLine(line)) {
      ingredients.push(stripBullet(line));
    }
  }

  return { ingredients, startIndex, endIndex: i };
}

function extractDirectionsBlock(lines: string[]) {
  let startIndex: number | null = null;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line) continue;
    if (isDirectionsHeading(line) || isNumberedStep(line)) {
      startIndex = i;
      break;
    }
  }

  if (startIndex === null) {
    return { directions: "", startIndex: null };
  }

  const directions: string[] = [];
  let i = startIndex;
  if (isDirectionsHeading(lines[i])) {
    i += 1;
  }

  for (; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line) continue;
    directions.push(line);
  }

  return { directions: directions.join("\n"), startIndex };
}

function cleanTitle(title: string) {
  let cleaned = title.replace(/^['"“”‘’]+|['"“”‘’]+$/g, "").trim();
  if (cleaned.length > TITLE_MAX_CHARS) {
    cleaned = cleaned.slice(0, TITLE_MAX_CHARS).trim();
  }
  return cleaned;
}

function isTitleCandidate(line: string) {
  if (!line) return false;
  if (line.length > TITLE_MAX_CHARS) return false;
  if (CTA_PATTERNS.test(line)) return false;
  if (/^#/.test(line)) return false;
  const hashtagCount = (line.match(/#/g) ?? []).length;
  const mentionCount = (line.match(/@/g) ?? []).length;
  if (hashtagCount > 2 || mentionCount > 2) return false;
  return true;
}

function titleCase(text: string) {
  return text
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function stripQuantity(line: string) {
  return line
    .replace(/^[-•–*]\s*/, "")
    .replace(
      /^([\d\s/¼½¾⅓⅔⅛⅜⅝⅞]+)?\s*(cups?|tbsp|tsp|teaspoons?|tablespoons?|oz|ounces?|g|kg|ml|l|lbs?|pounds?)?\s*/i,
      "",
    )
    .trim();
}

function extractMethodVerb(directions: string | undefined) {
  if (!directions) return undefined;
  const firstLine = directions.split("\n").find(Boolean);
  if (!firstLine) return undefined;
  const match = firstLine.match(DIRECTIONS_VERBS);
  return match?.[1];
}

function deriveTitle(
  ingredients: string[] | undefined,
  directions: string | undefined,
) {
  const ingredientLine = ingredients?.[0];
  const ingredientName = ingredientLine ? stripQuantity(ingredientLine) : "";
  const methodVerb = extractMethodVerb(directions);

  if (ingredientName) {
    if (methodVerb) {
      return `${titleCase(methodVerb)} ${titleCase(ingredientName)}`.slice(
        0,
        TITLE_MAX_CHARS,
      );
    }
    return titleCase(ingredientName).slice(0, TITLE_MAX_CHARS);
  }

  return undefined;
}

function extractDescription(
  lines: string[],
  title: string | undefined,
  ingredientStart: number | null,
  directionsStart: number | null,
) {
  const endIndex =
    ingredientStart !== null
      ? ingredientStart
      : directionsStart !== null
        ? directionsStart
        : lines.length;
  let descriptionLines = lines.slice(0, endIndex).filter(Boolean);

  descriptionLines = descriptionLines.filter((line) => !CTA_PATTERNS.test(line));

  if (title) {
    descriptionLines = descriptionLines.filter(
      (line) => line.trim().toLowerCase() !== title.toLowerCase().trim(),
    );
  }

  return descriptionLines.join("\n").trim() || undefined;
}

export function parseTikTokCaptionToRecipe(caption: string): ParsedRecipe {
  const normalizedCaption = normalizeTikTokCaption(caption);
  const lines = normalizedCaption.split("\n").map((line) => line.trim());

  const nonEmptyLines = lines.filter(Boolean);
  const candidateLines = nonEmptyLines.slice(0, 3);
  const titleCandidate = candidateLines.find((line) => isTitleCandidate(line));

  const ingredientsResult = extractIngredientsBlock(lines);
  const directionsResult = extractDirectionsBlock(lines);

  let ingredients =
    ingredientsResult.ingredients.length > 0
      ? ingredientsResult.ingredients
      : undefined;
  let directions = directionsResult.directions || undefined;

  if (!ingredients && !directions) {
    const ingredientLike = nonEmptyLines.filter((line) => isIngredientLine(line));
    const stepLike = nonEmptyLines.filter((line) => isStepLine(line));

    if (ingredientLike.length >= 3 && stepLike.length >= 2) {
      ingredients = ingredientLike.map(stripBullet);
      directions = stepLike.join("\n");
    }
  }

  let title = titleCandidate ? cleanTitle(titleCandidate) : undefined;
  if (!title) {
    title = deriveTitle(ingredients, directions);
  }

  const description = extractDescription(
    lines,
    title,
    ingredientsResult.startIndex,
    directionsResult.startIndex,
  );

  return {
    title,
    description,
    ingredients,
    directions,
    yields: null,
    servings: null,
    totalTimeMinutes: null,
  };
}
