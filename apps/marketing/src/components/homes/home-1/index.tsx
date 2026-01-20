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

export default function HomeOne() {
	return (
		<Wrapper>
			<HeaderOne />
			<div id="smooth-wrapper">
				<div id="smooth-content">
          <HeroHomeOne />
          <FeaturesHomeOne />
          <AboutHomeOne />
          <VideoHomeOne />
          <PricingHomeOne />
          <FaqHomeOne />
          <TestimonialHomeOne />
          <FooterOne />
        </div>
			</div>
		</Wrapper>
	);
}
