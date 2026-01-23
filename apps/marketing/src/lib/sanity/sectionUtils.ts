type SectionInput =
  | Array<{ _type: string; enabled?: boolean; [key: string]: unknown }>
  | undefined
  | null;

export const normalizeEnabledSections = (sections: SectionInput) => {
  if (!sections?.length) {
    return [];
  }

  return sections.filter((section) => section.enabled !== false);
};
