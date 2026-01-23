import AboutHomeOne from "./AboutHomeOne";
import FaqHomeOne from "./FaqHomeOne";
import FeaturesHomeOne from "./FeaturesHomeOne";
import HeroHomeOne from "./HeroHomeOne";
import PricingHomeOne from "./PricingHomeOne";
import TestimonialHomeOne from "./TestimonialHomeOne";
import VideoHomeOne from "./VideoHomeOne";

type ThemeSection = {
  _type: string;
};

const renderSection = (section: ThemeSection, index: number) => {
  switch (section._type) {
    case "hero":
      return <HeroHomeOne key={`hero-${index}`} />;
    case "featureGrid":
      return <FeaturesHomeOne key={`featureGrid-${index}`} />;
    case "about":
      return <AboutHomeOne key={`about-${index}`} />;
    case "video":
      return <VideoHomeOne key={`video-${index}`} />;
    case "pricing":
      return <PricingHomeOne key={`pricing-${index}`} />;
    case "faq":
      return <FaqHomeOne key={`faq-${index}`} />;
    case "testimonial":
      return <TestimonialHomeOne key={`testimonial-${index}`} />;
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
