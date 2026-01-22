import type { Metadata } from "next";
import HomeOne from "@/components/homes/home-1";
import CMSHomePage from "@/components/cms/CMSHomePage";
import { sanityClient } from "@/lib/sanity/client";
import { pageBySlugQuery } from "@/lib/sanity/queries";
import type { SanityPage } from "@/lib/sanity/types";

const homeSlug = "home";

const fetchHomePage = async (): Promise<SanityPage | null> => {
  if (!sanityClient) {
    return null;
  }

  try {
    return await sanityClient.fetch<SanityPage | null>(pageBySlugQuery, {
      slug: homeSlug,
    });
  } catch {
    return null;
  }
};

export async function generateMetadata(): Promise<Metadata> {
  const page = await fetchHomePage();
  const title = page?.seo?.title;
  const description = page?.seo?.description;

  if (!title && !description) {
    return {};
  }

  return {
    title,
    description,
  };
}

export default async function Page() {
  const page = await fetchHomePage();

  if (!page) {
    return <HomeOne />;
  }

  return <CMSHomePage page={page} />;
}
