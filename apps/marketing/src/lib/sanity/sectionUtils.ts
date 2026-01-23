const knownSectionTypes = new Set([
  "hero",
  "featureGrid",
  "about",
  "video",
  "pricing",
  "faq",
  "testimonial",
  "cta",
]);

type SectionInput = Array<{ _type: string; enabled?: boolean }> | undefined | null;

export const normalizeEnabledSections = (sections: SectionInput) => {
  if (!sections?.length) {
    return [];
  }

  return sections.filter(
    (section) => section.enabled !== false && knownSectionTypes.has(section._type),
  );
};
