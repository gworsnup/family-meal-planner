import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { fetchRecipeDetailWithTiming } from "@/lib/recipeDetail";
import MobileCookingView from "../../../../_components/MobileCookingView";

export default async function MobileCookPage({ params }: { params: Promise<{ slug: string; recipeId: string }> }) {
  const [{ slug, recipeId }, user] = await Promise.all([params, getCurrentUser()]);
  if (!user?.workspace || user.workspace.slug !== slug) notFound();
  const recipe = await fetchRecipeDetailWithTiming(recipeId, user.workspace.id);
  if (!recipe) notFound();
  return <MobileCookingView slug={slug} recipe={recipe} />;
}
