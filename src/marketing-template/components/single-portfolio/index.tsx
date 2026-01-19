import Breacrumb from "@/common/Breacrumb";
import FooterOne from "@/layouts/footers/FooterOne";
import HeaderOne from "@/layouts/headers/HeaderOne";
import Wrapper from "@/layouts/Wrapper";
import PortfolioDetailsArea from "./PortfolioDetailsArea";

 

export default function SinglePortfolio() {
  return (
    <Wrapper>
      <HeaderOne />
      <div id="smooth-wrapper">
        <div id="smooth-content">
          <Breacrumb title="Portfolio Details" page="Portfolio Details" />
          <PortfolioDetailsArea />      
          <FooterOne />         
        </div>
      </div>
    </Wrapper>
  )
}
