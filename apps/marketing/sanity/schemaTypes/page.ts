import { defineField, defineType } from "sanity";

export const page = defineType({
  name: "page",
  title: "Page",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "seo",
      title: "SEO",
      type: "object",
      fields: [
        defineField({
          name: "title",
          title: "SEO Title",
          type: "string",
        }),
        defineField({
          name: "description",
          title: "SEO Description",
          type: "text",
          rows: 3,
        }),
        defineField({
          name: "ogImage",
          title: "Open Graph Image",
          type: "image",
          options: { hotspot: true },
        }),
      ],
    }),
    defineField({
      name: "sections",
      title: "Sections",
      type: "array",
      of: [
        { type: "hero" },
        { type: "featureGrid" },
        { type: "about" },
        { type: "video" },
        { type: "pricing" },
        { type: "faq" },
        { type: "testimonial" },
        { type: "cta" },
      ],
    }),
  ],
});
