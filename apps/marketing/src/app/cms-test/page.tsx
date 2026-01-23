import { groq } from "next-sanity";
import { sanityClient } from "@/lib/sanity/client";

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

const homeSlug = "home";

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

const fetchPage = async (): Promise<SanityPageDebug | null> => {
  if (!sanityClient) {
    return null;
  }

  try {
    return await sanityClient.fetch<SanityPageDebug | null>(pageBySlugQuery, {
      slug: homeSlug,
    });
  } catch {
    return null;
  }
};

export default async function CmsTestPage() {
  const page = await fetchPage();

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
        <p>No Sanity page found for slug home.</p>
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
        <div>
          <dt>SEO title</dt>
          <dd>{page.seo?.title ?? "(none)"}</dd>
        </div>
        <div>
          <dt>SEO description</dt>
          <dd>{page.seo?.description ?? "(none)"}</dd>
        </div>
      </dl>
      <section>
        <h2>Sections</h2>
        {page.sections && page.sections.length > 0 ? (
          <ul>
            {page.sections.map((section, index) => (
              <li key={`${section._type ?? "section"}-${index}`}>
                <strong>{section._type ?? "(unknown)"}</strong> — {" "}
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
