import Breacrumb from "@/common/Breacrumb";
import FooterOne from "@/layouts/footers/FooterOne";
import HeaderOne from "@/layouts/headers/HeaderOne";
import Wrapper from "@/layouts/Wrapper";
import ContactArea from "./ContactArea";
import GoogleMap from "./GoogleMap";

 

type ContactContent = {
  breadcrumb?: { title?: string; page?: string };
  contactArea?: Parameters<typeof ContactArea>[0]["content"];
};

export default function Contactus({ content }: { content?: ContactContent }) {
  const breadcrumbTitle = content?.breadcrumb?.title ?? "Contact Us";
  const breadcrumbPage = content?.breadcrumb?.page ?? "Contact Us";

  return (
    <Wrapper>
      <HeaderOne />
      <div id="smooth-wrapper">
        <div id="smooth-content">
          <Breacrumb title={breadcrumbTitle} page={breadcrumbPage} />
          <ContactArea content={content?.contactArea} />
          <GoogleMap />          
          <FooterOne />
        </div>
      </div>
    </Wrapper>
  )
}
