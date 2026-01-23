import { groq } from "next-sanity";
import { sanityClient } from "@/lib/sanity/client";

const pageSectionsQuery = groq`
  *[_type == "page" && slug.current == $slug][0]{
    sections[]{_type, enabled}
  }
`;

type PageSectionsResult = {
  sections?: Array<{ _type: string; enabled?: boolean }>;
};

export const getPageSections = async (
  slug: string,
): Promise<{
  sections: Array<{ _type: string; enabled?: boolean }>;
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
