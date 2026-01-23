import Breacrumb from "@/common/Breacrumb";
import FooterOne from "@/layouts/footers/FooterOne";
import HeaderOne from "@/layouts/headers/HeaderOne";
import Wrapper from "@/layouts/Wrapper";
import ServiceArea from "./ServiceArea";
import FaqHomeOne from "../homes/home-1/FaqHomeOne";
import TestimonialHomeOne from "../homes/home-1/TestimonialHomeOne";


type ServiceContent = {
  breadcrumb?: { title?: string; page?: string };
  serviceArea?: Parameters<typeof ServiceArea>[0]["content"];
  faq?: Parameters<typeof FaqHomeOne>[0]["content"];
  testimonial?: Parameters<typeof TestimonialHomeOne>[0]["content"];
};

export default function Service({ content }: { content?: ServiceContent }) {
  const breadcrumbTitle = content?.breadcrumb?.title ?? "Our Services";
  const breadcrumbPage = content?.breadcrumb?.page ?? "Our Services";

  return (
    <Wrapper>
      <HeaderOne />
      <div id="smooth-wrapper">
        <div id="smooth-content">
          <Breacrumb title={breadcrumbTitle} page={breadcrumbPage} />
          <ServiceArea content={content?.serviceArea} />
          <FaqHomeOne content={content?.faq} />
          <TestimonialHomeOne content={content?.testimonial} />           
          <FooterOne />
        </div>
      </div>
    </Wrapper>
  )
}
