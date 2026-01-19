import Breacrumb from "@/common/Breacrumb";
import HeaderOne from "@/layouts/headers/HeaderOne";
import Wrapper from "@/layouts/Wrapper";
import AboutCta from "../about-us/AboutCta";
import FooterOne from "@/layouts/footers/FooterOne";
import FaqArea from "./FaqArea";

 

export default function Faq() {
  return (
     <Wrapper>
      <HeaderOne />
      <div id="smooth-wrapper">
        <div id="smooth-content">
          <Breacrumb title="FAQ s" page="FAQ s" />
          <FaqArea />
           
          <AboutCta />
          <FooterOne />
        </div>
      </div>
    </Wrapper>
  )
}
