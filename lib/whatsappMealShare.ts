type RecipeSourceCandidate = {
  sourceUrl?: string | null;
  url?: string | null;
  originalUrl?: string | null;
  importUrl?: string | null;
};

export function normalizeUrl(url?: string | null) {
  const trimmed = url?.trim();
  if (!trimmed) return "";
  if (/^www\./i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

export function formatMealEntry(dayLabel: string, recipeName: string, sourceUrl?: string | null) {
  const normalizedSource = normalizeUrl(sourceUrl);
  return `${dayLabel}: ${recipeName}
Source: ${normalizedSource || "(no source link)"}`;
}

export function getRecipeSourceUrl(recipe?: RecipeSourceCandidate | null) {
  return recipe?.sourceUrl ?? recipe?.url ?? recipe?.originalUrl ?? recipe?.importUrl ?? null;
}
