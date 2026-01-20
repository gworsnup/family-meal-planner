import Breacrumb from "@/common/Breacrumb";
import FooterOne from "@/layouts/footers/FooterOne";
import HeaderOne from "@/layouts/headers/HeaderOne";
import Wrapper from "@/layouts/Wrapper";
import PortfolioArea from "./PortfolioArea";

 

export default function Portfolio() {
  return (
     <Wrapper>
      <HeaderOne />
      <div id="smooth-wrapper">
        <div id="smooth-content">
          <Breacrumb title="Our Portfolio" page="Our Portfolio" />
          <PortfolioArea />                  
          <FooterOne />         
        </div>
      </div>
    </Wrapper>
  )
}
