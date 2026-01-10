export type ParsedIngredient = {
  raw: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  notes: string | null;
};

export type WeekList = {
  weekStart: string;
  title: string;
  weekId?: string;
  version?: number;
  smartList?: import("./smartListTypes").SmartListData | null;
  recipes: Array<{
    id: string;
    title: string;
    photoUrl: string | null;
    ingredientLines: Array<{ id: string; ingredient: string; position: number }>;
  }>;
};

export type CategoryKey =
  | "produce"
  | "meat"
  | "dairy"
  | "bakery"
  | "pantry"
  | "spices"
  | "frozen"
  | "canned"
  | "other";

export type IngredientDisplayItem = {
  id: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  notes: string | null;
  display: string;
  recipeIds: string[];
  raw: string;
};

export type CategoryView = {
  key: CategoryKey;
  label: string;
  items: IngredientDisplayItem[];
  recipes?: Array<{ id: string; title: string; items: IngredientDisplayItem[] }>;
};

export type AggregatedSourceItem = IngredientDisplayItem & {
  sources: Array<{ recipeId: string; sourceText: string }>;
};

export type AggregatedSourceCategoryView = {
  key: CategoryKey;
  label: string;
  items: AggregatedSourceItem[];
};

const UNIT_ALIASES: Record<string, string> = {
  g: "g",
  gram: "g",
  grams: "g",
  kg: "kg",
  kilogram: "kg",
  kilograms: "kg",
  ml: "ml",
  milliliter: "ml",
  milliliters: "ml",
  l: "l",
  liter: "l",
  liters: "l",
  tbsp: "tbsp",
  tablespoon: "tbsp",
  tablespoons: "tbsp",
  tsp: "tsp",
  teaspoon: "tsp",
  teaspoons: "tsp",
  cup: "cup",
  cups: "cup",
  oz: "oz",
  ounce: "oz",
  ounces: "oz",
  lb: "lb",
  lbs: "lb",
  pound: "lb",
  pounds: "lb",
};

const COUNTABLE_ITEMS = [
  "egg",
  "eggs",
  "lemon",
  "lemons",
  "lime",
  "limes",
  "tomato",
  "tomatoes",
  "onion",
  "onions",
  "garlic clove",
  "garlic cloves",
];

const CATEGORY_ORDER: Array<{ key: CategoryKey; label: string }> = [
  { key: "produce", label: "Produce (Vegetables / Fruit / Herbs)" },
  { key: "meat", label: "Meat & Fish" },
  { key: "dairy", label: "Dairy & Eggs" },
  { key: "bakery", label: "Bakery & Bread" },
  { key: "pantry", label: "Pantry (Condiments / Sauces)" },
  { key: "spices", label: "Spices" },
  { key: "frozen", label: "Frozen" },
  { key: "canned", label: "Canned / Jarred" },
  { key: "other", label: "Other" },
];

const CATEGORY_KEYWORDS: Record<CategoryKey, string[]> = {
  produce: [
    "onion",
    "garlic",
    "tomato",
    "carrot",
    "leek",
    "potato",
    "spinach",
    "broccoli",
    "lettuce",
    "cabbage",
    "celery",
    "courgette",
    "zucchini",
    "cucumber",
    "mushroom",
    "ginger",
    "herb",
    "basil",
    "parsley",
    "coriander",
    "cilantro",
    "thyme",
    "rosemary",
    "dill",
    "mint",
    "lemon",
    "lime",
    "apple",
    "banana",
    "berry",
    "orange",
  ],
  meat: [
    "chicken",
    "beef",
    "pork",
    "lamb",
    "bacon",
    "sausage",
    "salmon",
    "tuna",
    "prawn",
    "shrimp",
    "fish",
  ],
  dairy: ["milk", "cheese", "butter", "yogurt", "cream", "egg"],
  bakery: ["bread", "bagel", "bun", "roll", "tortilla", "pita"],
  pantry: [
    "soy sauce",
    "vinegar",
    "olive oil",
    "oil",
    "flour",
    "sugar",
    "pasta",
    "rice",
    "oat",
    "noodle",
    "honey",
    "maple syrup",
    "sauce",
    "stock",
    "broth",
  ],
  spices: ["paprika", "cumin", "chilli", "chili", "pepper", "cinnamon", "salt"],
  frozen: ["frozen"],
  canned: ["canned", "jarred", "tin", "tinned", "chickpeas", "beans"],
  other: [],
};

const LIQUID_KEYWORDS = ["milk", "water", "oil", "stock", "broth"];

const DRY_DENSITY: Record<string, number> = {
  flour: 0.53,
  sugar: 0.85,
  rice: 0.85,
  oats: 0.36,
};

const VOLUME_TO_ML: Record<string, number> = {
  cup: 240,
  tbsp: 15,
  tsp: 5,
};

function parseFraction(value: string): number | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed.includes(" ")) {
    const [whole, fraction] = trimmed.split(" ");
    const fractionValue = parseFraction(fraction);
    const wholeValue = Number(whole);
    if (Number.isNaN(wholeValue) || fractionValue === null) return null;
    return wholeValue + fractionValue;
  }
  if (trimmed.includes("/")) {
    const [numerator, denominator] = trimmed.split("/");
    const num = Number(numerator);
    const den = Number(denominator);
    if (!num || !den) return null;
    return num / den;
  }
  const numeric = Number(trimmed);
  return Number.isNaN(numeric) ? null : numeric;
}

function singularizeName(name: string) {
  const words = name.split(" ");
  if (words.length === 0) return name;
  const last = words[words.length - 1];
  let singular = last;
  if (last.endsWith("ies")) singular = `${last.slice(0, -3)}y`;
  else if (last.endsWith("oes")) singular = last.slice(0, -2);
  else if (last.endsWith("s") && !last.endsWith("ss")) singular = last.slice(0, -1);
  words[words.length - 1] = singular;
  return words.join(" ");
}

function normalizeName(value: string) {
  const cleaned = value
    .toLowerCase()
    .replace(/[,.;:]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return cleaned;
  return singularizeName(cleaned);
}

function extractNotes(text: string) {
  const notes: string[] = [];
  let next = text;
  const parentheticalMatches = next.match(/\([^)]*\)/g);
  if (parentheticalMatches) {
    parentheticalMatches.forEach((match) => notes.push(match.slice(1, -1)));
    next = next.replace(/\([^)]*\)/g, "").trim();
  }
  if (next.toLowerCase().includes("to taste")) {
    notes.push("to taste");
    next = next.replace(/to taste/gi, "").trim();
  }
  if (next.toLowerCase().includes("optional")) {
    notes.push("optional");
    next = next.replace(/optional/gi, "").trim();
  }
  return { notes: notes.length > 0 ? notes.join(", ") : null, text: next };
}

export function parseIngredientLine(text: string): ParsedIngredient {
  const raw = text.trim();
  const { notes, text: withoutNotes } = extractNotes(raw);
  let working = withoutNotes.trim();
  let quantity: number | null = null;
  let unit: string | null = null;

  const quantityMatch = working.match(/^(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?)/);
  if (quantityMatch) {
    quantity = parseFraction(quantityMatch[0]);
    working = working.slice(quantityMatch[0].length).trim();
  }

  if (working) {
    const unitMatch = working.match(
      /^([a-zA-Z]+)\b/
    );
    if (unitMatch) {
      const normalized = UNIT_ALIASES[unitMatch[1].toLowerCase()];
      if (normalized) {
        unit = normalized;
        working = working.slice(unitMatch[0].length).trim();
      }
    }
  }

  if (working.toLowerCase().startsWith("of ")) {
    working = working.slice(3).trim();
  }

  let name = normalizeName(working);

  if (!unit && quantity !== null) {
    const lower = name.toLowerCase();
    if (COUNTABLE_ITEMS.some((item) => lower.includes(item))) {
      unit = "pcs";
    }
  }

  if (!name) {
    name = normalizeName(raw);
  }

  return {
    raw,
    name,
    quantity,
    unit,
    notes,
  };
}

export function categorizeIngredient(name: string): CategoryKey {
  const lower = name.toLowerCase();
  for (const { key } of CATEGORY_ORDER) {
    const keywords = CATEGORY_KEYWORDS[key];
    if (keywords.some((keyword) => lower.includes(keyword))) {
      return key;
    }
  }
  return "other";
}

function formatQuantity(value: number) {
  if (Number.isInteger(value)) return value.toString();
  return value.toFixed(1).replace(/\.0$/, "");
}

function formatDisplayItem(item: {
  quantity: number | null;
  unit: string | null;
  name: string;
  notes: string | null;
}) {
  if (item.quantity === null) {
    return item.notes ? `${item.name} (${item.notes})` : item.name;
  }
  const unitLabel = item.unit && item.unit !== "pcs" ? ` ${item.unit}` : "";
  const base = `${formatQuantity(item.quantity)}${unitLabel} ${item.name}`.trim();
  return item.notes ? `${base} (${item.notes})` : base;
}

function convertToMetric(parsed: ParsedIngredient) {
  const { quantity, unit, name } = parsed;
  if (quantity === null || !unit) return parsed;

  if (unit === "kg") {
    return { ...parsed, quantity: quantity * 1000, unit: "g" };
  }
  if (unit === "l") {
    return { ...parsed, quantity: quantity * 1000, unit: "ml" };
  }

  if (unit in VOLUME_TO_ML) {
    const ml = quantity * VOLUME_TO_ML[unit];
    const lowerName = name.toLowerCase();
    if (LIQUID_KEYWORDS.some((keyword) => lowerName.includes(keyword))) {
      return { ...parsed, quantity: ml, unit: "ml" };
    }
    const densityEntry = Object.entries(DRY_DENSITY).find(([key]) =>
      lowerName.includes(key)
    );
    if (densityEntry) {
      return { ...parsed, quantity: ml * densityEntry[1], unit: "g" };
    }
    return parsed;
  }

  if (unit === "ml") {
    const lowerName = name.toLowerCase();
    const densityEntry = Object.entries(DRY_DENSITY).find(([key]) =>
      lowerName.includes(key)
    );
    if (densityEntry) {
      return { ...parsed, quantity: quantity * densityEntry[1], unit: "g" };
    }
  }

  return parsed;
}

function isMergeable(
  a: { unit: string | null; quantity: number | null },
  b: { unit: string | null; quantity: number | null }
) {
  if (a.unit !== b.unit) return false;
  if (a.quantity === null && b.quantity === null) return true;
  if (a.quantity === null || b.quantity === null) return false;
  return true;
}

function unitCategory(unit: string | null) {
  if (!unit) return null;
  if (unit === "g") return "g";
  if (unit === "ml") return "ml";
  if (unit === "pcs") return "pcs";
  return unit;
}

export function buildShoppingView(
  week: WeekList | null,
  opts: { aggregate: boolean; metric: boolean }
): CategoryView[] {
  const categoryMap = new Map<CategoryKey, CategoryView>();
  CATEGORY_ORDER.forEach(({ key, label }) => {
    categoryMap.set(key, { key, label, items: [] });
  });

  if (!week) return Array.from(categoryMap.values());

  const allRecipes = week.recipes.map((recipe, index) => ({
    ...recipe,
    order: index,
  }));

  if (!opts.aggregate) {
    const categoryRecipes = new Map<
      CategoryKey,
      Map<string, { id: string; title: string; items: IngredientDisplayItem[] }>
    >();

    allRecipes.forEach((recipe) => {
      recipe.ingredientLines.forEach((line) => {
        const parsed = parseIngredientLine(line.ingredient);
        const converted = opts.metric ? convertToMetric(parsed) : parsed;
        const category = categorizeIngredient(converted.name);
        const unit = unitCategory(converted.unit);
        const itemsForCategory =
          categoryRecipes.get(category) ?? new Map<string, { id: string; title: string; items: IngredientDisplayItem[] }>();
        const recipeEntry =
          itemsForCategory.get(recipe.id) ?? {
            id: recipe.id,
            title: recipe.title,
            items: [],
          };

        const displayItem: IngredientDisplayItem = {
          id: `${recipe.order}-${line.id}`,
          name: converted.name,
          quantity: converted.quantity,
          unit,
          notes: converted.notes,
          raw: converted.raw,
          display: formatDisplayItem({
            name: converted.name,
            quantity: converted.quantity,
            unit,
            notes: converted.notes,
          }),
          recipeIds: [recipe.id],
        };

        recipeEntry.items.push(displayItem);
        itemsForCategory.set(recipe.id, recipeEntry);
        categoryRecipes.set(category, itemsForCategory);
      });
    });

    CATEGORY_ORDER.forEach(({ key }) => {
      const categoryView = categoryMap.get(key);
      if (!categoryView) return;
      const recipesMap = categoryRecipes.get(key);
      if (!recipesMap) return;
      categoryView.recipes = allRecipes
        .filter((recipe) => recipesMap.has(recipe.id))
        .map((recipe) => recipesMap.get(recipe.id)!)
        .filter((recipe) => recipe.items.length > 0);
    });

    return Array.from(categoryMap.values());
  }

  const itemMap = new Map<string, IngredientDisplayItem>();

  allRecipes.forEach((recipe) => {
    recipe.ingredientLines.forEach((line) => {
      const parsed = parseIngredientLine(line.ingredient);
      const converted = opts.metric ? convertToMetric(parsed) : parsed;
      const category = categorizeIngredient(converted.name);
      const unit = unitCategory(converted.unit);
      const key = [
        category,
        converted.name,
        unit ?? "none",
        converted.notes ?? "none",
        converted.quantity === null ? "noq" : "q",
      ].join("|");

      const existing = itemMap.get(key);
      if (existing && isMergeable(existing, { unit, quantity: converted.quantity })) {
        const nextQuantity =
          existing.quantity !== null && converted.quantity !== null
            ? existing.quantity + converted.quantity
            : existing.quantity ?? converted.quantity;
        existing.quantity = nextQuantity ?? null;
        existing.recipeIds = Array.from(new Set([...existing.recipeIds, recipe.id]));
        existing.display = formatDisplayItem({
          name: existing.name,
          quantity: existing.quantity,
          unit: existing.unit,
          notes: existing.notes,
        });
        return;
      }

      const displayItem: IngredientDisplayItem = {
        id: key,
        name: converted.name,
        quantity: converted.quantity,
        unit,
        notes: converted.notes,
        raw: converted.raw,
        display: formatDisplayItem({
          name: converted.name,
          quantity: converted.quantity,
          unit,
          notes: converted.notes,
        }),
        recipeIds: [recipe.id],
      };

      itemMap.set(key, displayItem);
    });
  });

  itemMap.forEach((item) => {
    const category = categorizeIngredient(item.name);
    const categoryView = categoryMap.get(category);
    if (!categoryView) return;
    categoryView.items.push(item);
  });

  return Array.from(categoryMap.values());
}

export function getCategoryOrder() {
  return CATEGORY_ORDER;
}

export function buildAggregatedSourceView(
  week: WeekList | null,
): AggregatedSourceCategoryView[] {
  const categoryMap = new Map<CategoryKey, AggregatedSourceCategoryView>();
  CATEGORY_ORDER.forEach(({ key, label }) => {
    categoryMap.set(key, { key, label, items: [] });
  });

  if (!week) return Array.from(categoryMap.values());

  const itemMap = new Map<string, AggregatedSourceItem>();

  week.recipes.forEach((recipe) => {
    recipe.ingredientLines.forEach((line) => {
      const parsed = parseIngredientLine(line.ingredient);
      const category = categorizeIngredient(parsed.name);
      const unit = unitCategory(parsed.unit);
      const key = [
        category,
        parsed.name,
        unit ?? "none",
        parsed.notes ?? "none",
        parsed.quantity === null ? "noq" : "q",
      ].join("|");

      const existing = itemMap.get(key);
      if (existing && isMergeable(existing, { unit, quantity: parsed.quantity })) {
        const nextQuantity =
          existing.quantity !== null && parsed.quantity !== null
            ? existing.quantity + parsed.quantity
            : existing.quantity ?? parsed.quantity;
        existing.quantity = nextQuantity ?? null;
        existing.recipeIds = Array.from(new Set([...existing.recipeIds, recipe.id]));
        existing.display = formatDisplayItem({
          name: existing.name,
          quantity: existing.quantity,
          unit: existing.unit,
          notes: existing.notes,
        });
        existing.sources.push({ recipeId: recipe.id, sourceText: parsed.raw });
        return;
      }

      const displayItem: AggregatedSourceItem = {
        id: key,
        name: parsed.name,
        quantity: parsed.quantity,
        unit,
        notes: parsed.notes,
        raw: parsed.raw,
        display: formatDisplayItem({
          name: parsed.name,
          quantity: parsed.quantity,
          unit,
          notes: parsed.notes,
        }),
        recipeIds: [recipe.id],
        sources: [{ recipeId: recipe.id, sourceText: parsed.raw }],
      };

      itemMap.set(key, displayItem);
    });
  });

  itemMap.forEach((item) => {
    const category = categorizeIngredient(item.name);
    const categoryView = categoryMap.get(category);
    if (!categoryView) return;
    categoryView.items.push(item);
  });

  return Array.from(categoryMap.values());
}
