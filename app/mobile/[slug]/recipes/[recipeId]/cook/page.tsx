import { notFound } from "next/navigation";
import { getWorkspaceUser } from "@/lib/auth";
import { fetchRecipeDetailWithTiming } from "@/lib/recipeDetail";
import MobileCookingView from "../../../../_components/MobileCookingView";

export default async function MobileCookPage({ params }: { params: Promise<{ slug: string; recipeId: string }> }) {
  const { slug, recipeId } = await params;
  const user = await getWorkspaceUser(slug);
  if (!user) notFound();
  const recipe = await fetchRecipeDetailWithTiming(recipeId, user.workspace.id);
  if (!recipe) notFound();
  return <MobileCookingView slug={slug} recipe={recipe} />;
}
