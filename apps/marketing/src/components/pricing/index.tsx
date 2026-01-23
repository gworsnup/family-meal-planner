import Breacrumb from "@/common/Breacrumb";
import FooterOne from "@/layouts/footers/FooterOne";
import HeaderOne from "@/layouts/headers/HeaderOne";
import Wrapper from "@/layouts/Wrapper";
import FaqHomeOne from "../homes/home-1/FaqHomeOne";
import PricingArea from "./PricingArea";


type PricingContent = {
  breadcrumb?: { title?: string; page?: string };
  pricingArea?: Parameters<typeof PricingArea>[0]["content"];
  faq?: Parameters<typeof FaqHomeOne>[0]["content"];
};

export default function Pricing({ content }: { content?: PricingContent }) {
  const breadcrumbTitle = content?.breadcrumb?.title ?? "Pricing Plan";
  const breadcrumbPage = content?.breadcrumb?.page ?? "Pricing Plan";

  return (
    <Wrapper>
      <HeaderOne />
      <div id="smooth-wrapper">
        <div id="smooth-content">
          <Breacrumb title={breadcrumbTitle} page={breadcrumbPage} />
          <PricingArea content={content?.pricingArea} />            
          <FaqHomeOne style_2={true} content={content?.faq} />
          <FooterOne />
        </div>
      </div>
    </Wrapper>
  )
}
