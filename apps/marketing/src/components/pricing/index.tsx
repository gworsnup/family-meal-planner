import Breacrumb from "@/common/Breacrumb";
import FooterOne from "@/layouts/footers/FooterOne";
import HeaderOne from "@/layouts/headers/HeaderOne";
import Wrapper from "@/layouts/Wrapper";
import FaqHomeOne from "../homes/home-1/FaqHomeOne";
import PricingArea from "./PricingArea";

 

export default function Pricing() {
  return (
    <Wrapper>
      <HeaderOne />
      <div id="smooth-wrapper">
        <div id="smooth-content">
          <Breacrumb title="Pricing Plan" page="Pricing Plan" />
          <PricingArea />            
          <FaqHomeOne style_2={true} />
          <FooterOne />
        </div>
      </div>
    </Wrapper>
  )
}
