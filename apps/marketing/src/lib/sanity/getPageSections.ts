import { groq } from "next-sanity";
import { sanityClient } from "@/lib/sanity/client";

const pageSectionsQuery = groq`
  *[_type == "page" && slug.current == $slug][0]{
    title,
    "slug": slug.current,
    seo,
    sections[]
  }
`;

type PageSectionsResult = {
  sections?: Array<{ _type: string; enabled?: boolean; [key: string]: unknown }>;
};

export const getPageSections = async (
  slug: string,
): Promise<{
  sections: Array<{ _type: string; enabled?: boolean; [key: string]: unknown }>;
  found: boolean;
}> => {
  if (!sanityClient) {
    return { sections: [], found: false };
  }

  try {
    const page = await sanityClient.fetch<PageSectionsResult | null>(
      pageSectionsQuery,
      {
        slug,
      },
    );

    if (!page) {
      return { sections: [], found: false };
    }

    return {
      sections: page.sections ?? [],
      found: true,
    };
  } catch {
    return { sections: [], found: false };
  }
};
