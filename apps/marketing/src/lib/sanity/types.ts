export type SanityButton = {
  label?: string;
  href?: string;
};

export type SanitySeo = {
  title?: string;
  description?: string;
  ogImage?: unknown;
};

export type HeroSection = {
  _type: "hero";
  _key?: string;
  enabled?: boolean;
  headline?: string;
  subheadline?: string;
  primaryButton?: SanityButton;
  secondaryButton?: SanityButton;
};

export type FeatureGridSection = {
  _type: "featureGrid";
  _key?: string;
  enabled?: boolean;
  headline?: string;
  subheadline?: string;
};

export type AboutSection = {
  _type: "about";
  _key?: string;
  enabled?: boolean;
  headline?: string;
  subheadline?: string;
  body?: string;
  button?: SanityButton;
};

export type VideoSection = {
  _type: "video";
  _key?: string;
  enabled?: boolean;
  headline?: string;
  subheadline?: string;
};

export type PricingSection = {
  _type: "pricing";
  _key?: string;
  enabled?: boolean;
  headline?: string;
  subheadline?: string;
};

export type FaqSection = {
  _type: "faq";
  _key?: string;
  enabled?: boolean;
  headline?: string;
  subheadline?: string;
};

export type TestimonialSection = {
  _type: "testimonial";
  _key?: string;
  enabled?: boolean;
  headline?: string;
  subheadline?: string;
};

export type CtaSection = {
  _type: "cta";
  _key?: string;
  enabled?: boolean;
  headline?: string;
  subheadline?: string;
  button?: SanityButton;
};

export type SanitySection =
  | HeroSection
  | FeatureGridSection
  | AboutSection
  | VideoSection
  | PricingSection
  | FaqSection
  | TestimonialSection
  | CtaSection;

export type SanityPage = {
  _id: string;
  _type: "page";
  title?: string;
  slug?: string;
  seo?: SanitySeo;
  sections?: SanitySection[];
};
