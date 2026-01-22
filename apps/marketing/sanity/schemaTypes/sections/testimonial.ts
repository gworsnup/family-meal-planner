import { defineField, defineType } from "sanity";

export const testimonial = defineType({
  name: "testimonial",
  title: "Testimonial",
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
  ],
});
