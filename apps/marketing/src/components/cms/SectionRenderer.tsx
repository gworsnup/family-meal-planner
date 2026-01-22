import type { SanitySection } from "@/lib/sanity/types";
import HeroHomeOne from "@/components/homes/home-1/HeroHomeOne";
import FeaturesHomeOne from "@/components/homes/home-1/FeaturesHomeOne";
import AboutHomeOne from "@/components/homes/home-1/AboutHomeOne";
import VideoHomeOne from "@/components/homes/home-1/VideoHomeOne";
import PricingHomeOne from "@/components/homes/home-1/PricingHomeOne";
import FaqHomeOne from "@/components/homes/home-1/FaqHomeOne";
import TestimonialHomeOne from "@/components/homes/home-1/TestimonialHomeOne";

const getSectionKey = (section: SanitySection, index: number) =>
  section._key ?? `${section._type}-${index}`;

const SectionRenderer = ({ sections }: { sections?: SanitySection[] }) => {
  if (!sections?.length) {
    return null;
  }

  return (
    <>
      {sections
        .filter((section) => section.enabled !== false)
        .map((section, index) => {
          const key = getSectionKey(section, index);

          switch (section._type) {
            case "hero":
              return <HeroHomeOne key={key} />;
            case "featureGrid":
              return <FeaturesHomeOne key={key} />;
            case "about":
              return <AboutHomeOne key={key} />;
            case "video":
              return <VideoHomeOne key={key} />;
            case "pricing":
              return <PricingHomeOne key={key} />;
            case "faq":
              return <FaqHomeOne key={key} />;
            case "testimonial":
              return <TestimonialHomeOne key={key} />;
            case "cta":
            default:
              return null;
          }
        })}
    </>
  );
};

export default SectionRenderer;
