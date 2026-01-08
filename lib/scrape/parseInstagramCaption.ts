import { decodeHtmlEntities } from "./html";

export type InstagramIngredientLine = {
  ingredient: string;
};

export type InstagramCaptionParseResult = {
  title?: string;
  description?: string;
  ingredientLines?: InstagramIngredientLine[];
  directionsText?: string;
  titleHeuristic?: string;
};

const TITLE_MAX_CHARS = 80;
const FOOD_WORDS = [
  "soup",
  "salad",
  "pasta",
  "chicken",
  "potato",
  "potatoes",
  "leek",
  "garlic",
  "onion",
  "bread",
  "cake",
  "cookies",
  "curry",
  "stew",
  "rice",
  "noodles",
  "tacos",
  "pizza",
  "wrap",
  "sandwich",
  "burger",
  "dessert",
  "chocolate",
  "beans",
  "lentil",
  "tofu",
  "fish",
  "salmon",
  "shrimp",
  "broth",
  "sauce",
];

const CTA_PATTERNS =
  /link in bio|subscribe|comment|dm|follow|giveaway|save this|tap bio|newsletter|sign up|order now|watch full/i;

const BULLET_CHARS = /[•·▪●◦]/g;

function normalizeCaption(caption: string) {
  let normalized = decodeHtmlEntities(caption);
  normalized = normalized.replace(/\r\n/g, "\n");
  normalized = normalized.replace(BULLET_CHARS, "-");
  normalized = normalized.replace(/\n{3,}/g, "\n\n");

  const rawLines = normalized.split("\n").map((line) => line.trim());
  const cleanedLines: string[] = [];
  let seenContent = false;

  rawLines.forEach((line) => {
    if (!line) {
      cleanedLines.push("");
      return;
    }

    const isHashtagLine = /^(#\w+\s*)+$/i.test(line);
    const isMentionLine = /^(@[\w.]+\s*)+$/i.test(line);
    const isFiller = isHashtagLine || isMentionLine;

    if (!seenContent && !isFiller) {
      seenContent = true;
    }

    if (seenContent && isFiller) {
      return;
    }

    cleanedLines.push(line);
  });

  return cleanedLines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function containsFoodWords(text: string) {
  return FOOD_WORDS.some((word) =>
    new RegExp(`\\b${word}\\b`, "i").test(text),
  );
}

function cleanTitle(title: string) {
  let cleaned = title
    .replace(/^[\w.]+\s+on\s+[A-Za-z]+\s+\d{1,2},\s+\d{4}:\s*/i, "")
    .replace(/^["'“”‘’]+|["'“”‘’]+$/g, "")
    .replace(/[\p{Extended_Pictographic}\p{Emoji_Presentation}]+$/gu, "")
    .trim();
  if (cleaned.length > TITLE_MAX_CHARS) {
    cleaned = cleaned.slice(0, TITLE_MAX_CHARS).trim();
  }
  return cleaned;
}

function extractTitleFromCaption(
  caption: string,
  fallbackTitle?: string | null,
) {
  const lines = caption
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const firstLine = lines[0] ?? "";
  const secondLine = lines[1] ?? "";

  const delimiterPatterns: { regex: RegExp; label: string }[] = [
    { regex: /^recipe:\s*(.+)$/i, label: "recipe-prefix" },
    { regex: /^recipe\s*-\s*(.+)$/i, label: "recipe-prefix" },
    { regex: /^the\s+#?\d+\s+recipe[^:]*:\s*(.+)$/i, label: "promo-delimiter" },
    { regex: /^(.+)\s+recipe$/i, label: "suffix-recipe" },
  ];

  for (const { regex, label } of delimiterPatterns) {
    const match = firstLine.match(regex);
    if (match?.[1]) {
      return {
        title: cleanTitle(match[1]),
        heuristic: label,
      };
    }
  }

  const dishPattern = /([A-Za-z][\w'’]+(?:\s+[A-Za-z][\w'’]+)*\s+(?:&|\/|and|with)\s+[A-Za-z][\w'’]+(?:\s+[A-Za-z][\w'’]+)*)/;
  const dishMatch = `${firstLine} ${secondLine}`.match(dishPattern);
  if (dishMatch?.[1]) {
    return { title: cleanTitle(dishMatch[1]), heuristic: "dish-phrase" };
  }

  const sentences = caption
    .split(/(?:[.!?]\s+|\n)/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  for (const sentence of sentences) {
    if (CTA_PATTERNS.test(sentence) && !containsFoodWords(sentence)) {
      continue;
    }
    return { title: cleanTitle(sentence), heuristic: "first-sentence" };
  }

  if (fallbackTitle) {
    return { title: cleanTitle(fallbackTitle), heuristic: "fallback-title" };
  }

  return { title: undefined, heuristic: "none" };
}

function isIngredientMarker(line: string) {
  return /^(ingredients?|you will need|what you need|shopping list)\b/i.test(line);
}

function isDirectionsMarker(line: string) {
  return /^(method|directions?|instructions?|steps)\b/i.test(line);
}

function isNumberedStep(line: string) {
  return /^\d+[\.)]\s+/.test(line);
}

function isIngredientLine(line: string) {
  if (!line) return false;
  if (isNumberedStep(line)) {
    return false;
  }
  if (/^\d+/.test(line)) {
    return true;
  }
  if (/^-/.test(line) && containsFoodWords(line)) {
    return true;
  }
  return false;
}

function extractIngredientsBlock(lines: string[]) {
  let startIndex: number | null = null;
  let collected: InstagramIngredientLine[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line) continue;
    if (isIngredientMarker(line)) {
      startIndex = i;
      const inline = line.split(/ingredients?:/i)[1]?.trim();
      if (inline) {
        inline
          .split(/\s+-\s+/)
          .filter(Boolean)
          .forEach((item) => {
            collected.push({ ingredient: item.trim() });
          });
      }
      break;
    }
    if (isIngredientLine(line)) {
      startIndex = i;
      break;
    }
  }

  if (startIndex === null) {
    return { ingredientLines: [], startIndex: null, endIndex: null };
  }

  let i = startIndex;
  if (isIngredientMarker(lines[i])) {
    i += 1;
  }

  for (; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line) {
      const nextLine = lines.slice(i + 1).find((item) => item.trim());
      if (nextLine && (isDirectionsMarker(nextLine) || isNumberedStep(nextLine))) {
        break;
      }
      continue;
    }
    if (isDirectionsMarker(line) || isNumberedStep(line)) {
      break;
    }
    collected.push({ ingredient: line.replace(/^-\s*/, "") });
  }

  return {
    ingredientLines: collected,
    startIndex,
    endIndex: i,
  };
}

function extractDirectionsBlock(lines: string[]) {
  let startIndex: number | null = null;
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line) continue;
    if (isDirectionsMarker(line)) {
      startIndex = i;
      break;
    }
    if (isNumberedStep(line)) {
      startIndex = i;
      break;
    }
  }

  if (startIndex === null) {
    return { directions: "", startIndex: null };
  }

  let i = startIndex;
  if (isDirectionsMarker(lines[i])) {
    i += 1;
  }

  const directions: string[] = [];
  for (; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line) continue;
    directions.push(line);
  }

  return {
    directions: directions.join("\n"),
    startIndex,
  };
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
  let descriptionLines = lines.slice(0, endIndex).filter((line) => line.trim());

  while (descriptionLines.length > 0) {
    const line = descriptionLines[0];
    if (CTA_PATTERNS.test(line) && !containsFoodWords(line)) {
      descriptionLines.shift();
      continue;
    }
    break;
  }

  if (title) {
    descriptionLines = descriptionLines.filter(
      (line) =>
        line.trim() &&
        line.trim().toLowerCase() !== title.toLowerCase().trim(),
    );
  }

  return descriptionLines.join("\n").trim() || undefined;
}

export function parseInstagramCaptionToRecipe(
  caption: string,
  fallbackTitle?: string | null,
): InstagramCaptionParseResult {
  const normalizedCaption = normalizeCaption(caption);
  const lines = normalizedCaption
    .split("\n")
    .map((line) => line.trim());

  const { title, heuristic } = extractTitleFromCaption(
    normalizedCaption,
    fallbackTitle,
  );

  const ingredientsResult = extractIngredientsBlock(lines);
  const directionsResult = extractDirectionsBlock(lines);
  const description = extractDescription(
    lines,
    title,
    ingredientsResult.startIndex,
    directionsResult.startIndex,
  );

  return {
    title,
    description,
    ingredientLines:
      ingredientsResult.ingredientLines.length > 0
        ? ingredientsResult.ingredientLines
        : undefined,
    directionsText: directionsResult.directions || undefined,
    titleHeuristic: heuristic,
  };
}
