import { redirect } from "next/navigation";

export default async function MobileWorkspacePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/mobile/${slug}/plan`);
}
