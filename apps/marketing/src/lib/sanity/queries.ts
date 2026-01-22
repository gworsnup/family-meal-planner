export const pageBySlugQuery = `
  *[_type == "page" && slug.current == $slug][0]{
    _id,
    _type,
    title,
    "slug": slug.current,
    seo {
      title,
      description,
      ogImage
    },
    sections[] {
      ...,
      _type
    }
  }
`;
