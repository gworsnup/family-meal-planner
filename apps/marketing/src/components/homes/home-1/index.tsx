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
import { homeContent } from "@/content/home";

export default function HomeOne() {
  return (
    <Wrapper>
      <HeaderOne />
      <div id="smooth-wrapper">
        <div id="smooth-content">
          <HeroHomeOne content={homeContent.hero} />
          <FeaturesHomeOne content={homeContent.featureGrid} />
          <AboutHomeOne content={homeContent.about} />
          <VideoHomeOne content={homeContent.video} />
          <PricingHomeOne content={homeContent.pricing} />
          <FaqHomeOne content={homeContent.faq} />
          <TestimonialHomeOne content={homeContent.testimonial} />
          <FooterOne />
        </div>
      </div>
    </Wrapper>
  );
}
