import Breacrumb from "@/common/Breacrumb";
import FooterOne from "@/layouts/footers/FooterOne";
import HeaderOne from "@/layouts/headers/HeaderOne";
import Wrapper from "@/layouts/Wrapper";
import ServiceArea from "./ServiceArea";
import FaqHomeOne from "../homes/home-1/FaqHomeOne";
import TestimonialHomeOne from "../homes/home-1/TestimonialHomeOne";



export default function Service() {
  return (
    <Wrapper>
      <HeaderOne />
      <div id="smooth-wrapper">
        <div id="smooth-content">
          <Breacrumb title="Our Services" page="Our Services" />
          <ServiceArea />
          <FaqHomeOne />
          <TestimonialHomeOne />           
          <FooterOne />
        </div>
      </div>
    </Wrapper>
  )
}
