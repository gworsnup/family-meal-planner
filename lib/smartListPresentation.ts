export const SMART_CATEGORY_EMOJI: Record<string, string> = {
  "fresh produce (fruit, veg, fresh herbs)": "🥕🥦🍎",
  "meat & seafood": "🥩🐟🍤",
  "dairy, eggs, cheese & fridge": "🥛🥚🧀",
  "dry herbs & spices": "🌿🧂🌶️",
  "condiments & sauces": "🍅🫙🥫",
  "pasta & grains": "🍝🌾🍚",
  "oils & vinegars": "🫒🍶🍾",
  "flours, bakery & sugars": "🍞🌾🍬",
  "pantry (biscuits, tins, other)": "🥫🍪📦",
  frozen: "🧊",
  produce: "🥕🥦🍎",
  meat: "🥩🐟🍤",
  dairy: "🥛🥚🧀",
  bakery: "🍞🌾",
  pantry: "🍅🫙🥫",
  spices: "🌿🧂🌶️",
  canned: "🥫🫙",
  other: "📦🔧✨",
};

export function getSmartCategoryEmoji(label: string) {
  return SMART_CATEGORY_EMOJI[label.trim().toLowerCase()] ?? "🍽️";
}
