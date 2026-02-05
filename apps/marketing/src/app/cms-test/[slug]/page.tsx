import { groq } from "next-sanity";
import { sanityClient } from "@/lib/sanity/client";

type SanityPageDebug = {
  title?: string;
  slug?: string;
  seo?: {
    title?: string;
    description?: string;
  };
  sections?: Array<{
    _type?: string;
    enabled?: boolean;
  }>;
};

const pageBySlugQuery = groq`
  *[_type == "page" && slug.current == $slug][0]{
    title,
    "slug": slug.current,
    seo,
    sections[]{
      _type,
      enabled
    }
  }
`;

type CmsTestPageProps = {
  params: {
    slug: string;
  };
};

const fetchPage = async (slug: string): Promise<SanityPageDebug | null> => {
  if (!sanityClient) {
    return null;
  }

  try {
    return await sanityClient.fetch<SanityPageDebug | null>(pageBySlugQuery, {
      slug,
    });
  } catch {
    return null;
  }
};

export default async function CmsTestSlugPage({ params }: CmsTestPageProps) {
  const page = await fetchPage(params.slug);

  if (!page) {
    return (
      <main>
        <h1>Sanity CMS Test</h1>
        <dl>
          <div>
            <dt>Page found</dt>
            <dd>No</dd>
          </div>
        </dl>
        <p>No page found for slug: {params.slug}</p>
      </main>
    );
  }

  return (
    <main>
      <h1>Sanity CMS Test</h1>
      <dl>
        <div>
          <dt>Page found</dt>
          <dd>Yes</dd>
        </div>
        <div>
          <dt>Title</dt>
          <dd>{page.title ?? "(missing)"}</dd>
        </div>
        <div>
          <dt>Slug</dt>
          <dd>{page.slug ?? "(missing)"}</dd>
        </div>
      </dl>
      <section>
        <h2>Sections</h2>
        {page.sections && page.sections.length > 0 ? (
          <ul>
            {page.sections.map((section, index) => (
              <li key={`${section._type ?? "section"}-${index}`}>
                {section._type ?? "(unknown)"} —{" "}
                {section.enabled ? "enabled" : "disabled"}
              </li>
            ))}
          </ul>
        ) : (
          <p>No sections configured.</p>
        )}
      </section>
    </main>
  );
}
