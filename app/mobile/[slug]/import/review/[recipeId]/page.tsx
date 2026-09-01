import { notFound } from "next/navigation";
import { getWorkspaceUser } from "@/lib/auth";
import { fetchRecipeDetailWithTiming } from "@/lib/recipeDetail";
import MobileRecipeReview from "../../../../_components/MobileRecipeReview";

export default async function MobileRecipeReviewPage({
  params,
}: {
  params: Promise<{ slug: string; recipeId: string }>;
}) {
  const { slug, recipeId } = await params;
  const user = await getWorkspaceUser(slug);
  if (!user) notFound();

  const recipe = await fetchRecipeDetailWithTiming(recipeId, user.workspace.id);
  if (!recipe) notFound();

  return <MobileRecipeReview slug={slug} recipe={recipe} />;
}
