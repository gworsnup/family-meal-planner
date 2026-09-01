import type { Metadata } from "next";
import MobileImportClient from "../../_components/MobileImportClient";

export const metadata: Metadata = { title: "Import recipe" };

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function MobileImportPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  return <MobileImportClient slug={slug} initialUrl={first(query.url) ?? ""} />;
}
