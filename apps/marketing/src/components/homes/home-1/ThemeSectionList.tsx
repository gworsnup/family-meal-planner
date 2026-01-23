import AboutHomeOne from "./AboutHomeOne";
import FaqHomeOne from "./FaqHomeOne";
import FeaturesHomeOne from "./FeaturesHomeOne";
import HeroHomeOne from "./HeroHomeOne";
import PricingHomeOne from "./PricingHomeOne";
import TestimonialHomeOne from "./TestimonialHomeOne";
import VideoHomeOne from "./VideoHomeOne";

type ThemeSection = {
  _type: string;
  [key: string]: unknown;
};

const renderSection = (section: ThemeSection, index: number) => {
  switch (section._type) {
    case "hero":
      return <HeroHomeOne key={`hero-${index}`} content={section} />;
    case "featureGrid":
      return <FeaturesHomeOne key={`featureGrid-${index}`} content={section} />;
    case "about":
      return <AboutHomeOne key={`about-${index}`} content={section} />;
    case "video":
      return <VideoHomeOne key={`video-${index}`} content={section} />;
    case "pricing":
      return <PricingHomeOne key={`pricing-${index}`} content={section} />;
    case "faq":
      return <FaqHomeOne key={`faq-${index}`} content={section} />;
    case "testimonial":
      return <TestimonialHomeOne key={`testimonial-${index}`} content={section} />;
    default:
      return null;
  }
};

export default function ThemeSectionList({
  sections,
}: {
  sections: ThemeSection[];
}) {
  return <>{sections.map(renderSection)}</>;
}
