import HeaderOne from "@/layouts/headers/HeaderOne";
import Wrapper from "@/layouts/Wrapper";
import HeroHomeOne from "./HeroHomeOne";
import FeaturesHomeOne from "./FeaturesHomeOne";
import AboutHomeOne from "./AboutHomeOne";
import VideoHomeOne from "./VideoHomeOne";
import PricingHomeOne from "./PricingHomeOne";
import FaqHomeOne from "./FaqHomeOne";
import TestimonialHomeOne from "./TestimonialHomeOne";
import FooterOne from "@/layouts/footers/FooterOne";
import { sanityClient } from "@/lib/sanity/client";
import { pageBySlugQuery } from "@/lib/sanity/queries";
import type { SanityPage, SanitySection } from "@/lib/sanity/types";

type HomeSectionType =
  | "hero"
  | "featureGrid"
  | "about"
  | "video"
  | "pricing"
  | "faq"
  | "testimonial"
  | "cta";

const homeSlug = "home";
const knownSectionTypes = new Set<HomeSectionType>([
  "hero",
  "featureGrid",
  "about",
  "video",
  "pricing",
  "faq",
  "testimonial",
  "cta",
]);

const isKnownSectionType = (sectionType: string): sectionType is HomeSectionType =>
  knownSectionTypes.has(sectionType as HomeSectionType);

const fetchHomeSections = async (): Promise<SanitySection[] | null> => {
  if (!sanityClient) {
    return null;
  }

  try {
    const page = await sanityClient.fetch<SanityPage | null>(pageBySlugQuery, {
      slug: homeSlug,
    });

    return page?.sections ?? null;
  } catch {
    return null;
  }
};

const getEnabledSectionSet = (sections: SanitySection[] | null) => {
  if (!sections?.length) {
    return null;
  }

  const enabledSections = sections.filter(
    (section) => section.enabled !== false && isKnownSectionType(section._type),
  );

  return new Set<HomeSectionType>(enabledSections.map((section) => section._type));
};

const shouldRenderSection = (
  sectionType: Exclude<HomeSectionType, "cta">,
  enabledSections: Set<HomeSectionType> | null,
) => {
  if (!enabledSections) {
    return true;
  }

  return enabledSections.has(sectionType);
};

export default async function HomeOne() {
  const sections = await fetchHomeSections();
  const enabledSections = getEnabledSectionSet(sections);

  return (
    <Wrapper>
      <HeaderOne />
      <div id="smooth-wrapper">
        <div id="smooth-content">
          {shouldRenderSection("hero", enabledSections) && <HeroHomeOne />}
          {shouldRenderSection("featureGrid", enabledSections) && (
            <FeaturesHomeOne />
          )}
          {shouldRenderSection("about", enabledSections) && <AboutHomeOne />}
          {shouldRenderSection("video", enabledSections) && <VideoHomeOne />}
          {shouldRenderSection("pricing", enabledSections) && (
            <PricingHomeOne />
          )}
          {shouldRenderSection("faq", enabledSections) && <FaqHomeOne />}
          {shouldRenderSection("testimonial", enabledSections) && (
            <TestimonialHomeOne />
          )}
          <FooterOne />
        </div>
      </div>
    </Wrapper>
  );
}
