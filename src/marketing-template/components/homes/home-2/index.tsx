import HeaderTwo from "@/layouts/headers/HeaderTwo";
import Wrapper from "@/layouts/Wrapper";
import HeroHomeTwo from "./HeroHomeTwo";
import FeaturesHomeTwo from "./FeaturesHomeTwo";
import DividerArea from "@/common/DividerArea";
import AboutHomeTwo from "./AboutHomeTwo";
import BrandHomeTwo from "./BrandHomeTwo";
import TestimonialHomeTwo from "./TestimonialHomeTwo";
import BlogHomeTwo from "./BlogHomeTwo";
import FaqHomeTwo from "./FaqHomeTwo";
import FooterTwo from "@/layouts/footers/FooterTwo";


export default function HomeTwo() {
  return (
    <Wrapper>
      <HeaderTwo />
      <div id="smooth-wrapper">
        <div id="smooth-content">
          <HeroHomeTwo />
          <FeaturesHomeTwo />
          <DividerArea />
          <AboutHomeTwo />
          <BrandHomeTwo />
          <TestimonialHomeTwo />
          <DividerArea />
          <BlogHomeTwo />
          <FaqHomeTwo />
          <FooterTwo />
        </div>
      </div>
    </Wrapper>
  )
}
