export type UpdateRecipeInput = {
  title: string;
  description?: string | null;
  sourceName?: string | null;
  sourceUrl?: string | null;
  photoUrl?: string | null;
  directions?: string | null;
  prepTimeMinutes?: number | null;
  cookTimeMinutes?: number | null;
  totalTimeMinutes?: number | null;
  servings?: string | null;
  yields?: string | null;
  rating: number | null;
  isPrivate: boolean;
  ingredientsText: string;
};

export type RecipeDetail = {
  id: string;
  title: string;
  description: string | null;
  sourceName: string | null;
  sourceUrl: string | null;
  photoUrl: string | null;
  prepTimeMinutes: number | null;
  cookTimeMinutes: number | null;
  totalTimeMinutes: number | null;
  servings: string | null;
  yields: string | null;
  rating: number | null;
  directions: string | null;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
  tags: Array<{
    id: string;
    name: string;
  }>;
  ingredientLines: Array<{
    id: string;
    ingredient: string;
    position: number;
  }>;
};
