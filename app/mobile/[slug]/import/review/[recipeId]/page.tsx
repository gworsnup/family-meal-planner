import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { fetchRecipeDetailWithTiming } from "@/lib/recipeDetail";
import MobileRecipeReview from "../../../../_components/MobileRecipeReview";

export default async function MobileRecipeReviewPage({
  params,
}: {
  params: Promise<{ slug: string; recipeId: string }>;
}) {
  const { slug, recipeId } = await params;
  const user = await getCurrentUser();
  if (!user?.workspace || user.workspace.slug !== slug) notFound();

  const recipe = await fetchRecipeDetailWithTiming(recipeId, user.workspace.id);
  if (!recipe) notFound();

  return <MobileRecipeReview slug={slug} recipe={recipe} />;
}
