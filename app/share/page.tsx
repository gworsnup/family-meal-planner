import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function extractSharedUrl(searchParams: SearchParams) {
  const candidates = [
    first(searchParams.url),
    first(searchParams.text),
    first(searchParams.title),
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    const match = candidate.match(/https?:\/\/[^\s]+/i);
    if (match) return match[0].replace(/[),.;]+$/, "");
  }

  return "";
}

export default async function ShareTargetPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const sharedUrl = extractSharedUrl(params);
  const user = await getCurrentUser();

  if (!user) {
    const nextParams = new URLSearchParams();
    if (sharedUrl) nextParams.set("url", sharedUrl);
    const next = `/share${nextParams.size ? `?${nextParams.toString()}` : ""}`;
    redirect(`/?next=${encodeURIComponent(next)}`);
  }

  if (user.isAdmin) redirect("/admin");
  if (!user.workspace) {
    redirect(user.hasCreatedWorkspace ? "/onboarding/locked" : "/onboarding/household");
  }

  const importParams = new URLSearchParams();
  if (sharedUrl) importParams.set("url", sharedUrl);
  redirect(
    `/mobile/${user.workspace.slug}/import${
      importParams.size ? `?${importParams.toString()}` : ""
    }`,
  );
}
