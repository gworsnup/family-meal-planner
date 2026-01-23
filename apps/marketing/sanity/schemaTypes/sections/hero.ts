import { defineField, defineType } from "sanity";

export const hero = defineType({
  name: "hero",
  title: "Hero",
  type: "object",
  fields: [
    defineField({
      name: "enabled",
      title: "Enabled",
      type: "boolean",
      initialValue: true,
    }),
    defineField({
      name: "headline",
      title: "Headline",
      type: "string",
    }),
    defineField({
      name: "subheadline",
      title: "Subheadline",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "primaryButton",
      title: "Primary Button",
      type: "object",
      fields: [
        defineField({
          name: "label",
          title: "Label",
          type: "string",
        }),
        defineField({
          name: "href",
          title: "Link",
          type: "url",
        }),
      ],
    }),
    defineField({
      name: "primaryCta",
      title: "Primary CTA",
      type: "object",
      fields: [
        defineField({
          name: "label",
          title: "Label",
          type: "string",
        }),
        defineField({
          name: "href",
          title: "Link",
          type: "url",
        }),
      ],
    }),
    defineField({
      name: "secondaryButton",
      title: "Secondary Button",
      type: "object",
      fields: [
        defineField({
          name: "label",
          title: "Label",
          type: "string",
        }),
        defineField({
          name: "href",
          title: "Link",
          type: "url",
        }),
      ],
    }),
    defineField({
      name: "image",
      title: "Image",
      type: "image",
    }),
    defineField({
      name: "imageAlt",
      title: "Image Alt",
      type: "string",
    }),
  ],
});
