import Breacrumb from "@/common/Breacrumb";
import HeaderOne from "@/layouts/headers/HeaderOne";
import Wrapper from "@/layouts/Wrapper";
import AboutArea from "./AboutArea";
import AboutCounter from "./AboutCounter";
import SolutionsArea from "./SolutionsArea";
import OurWorkArea from "./OurWorkArea";
import AboutTeam from "./AboutTeam";
import AboutCta from "./AboutCta";
import FooterOne from "@/layouts/footers/FooterOne";

 

type AboutContent = {
  breadcrumb?: { title?: string; page?: string };
  hero?: Parameters<typeof AboutArea>[0]["content"];
  counters?: Parameters<typeof AboutCounter>[0]["content"];
  solutions?: Parameters<typeof SolutionsArea>[0]["content"];
  values?: Parameters<typeof OurWorkArea>[0]["content"];
  team?: Parameters<typeof AboutTeam>[0]["content"];
  cta?: Parameters<typeof AboutCta>[0]["content"];
};

export default function Aboutus({ content }: { content?: AboutContent }) {
  const breadcrumbTitle = content?.breadcrumb?.title ?? "About Us";
  const breadcrumbPage = content?.breadcrumb?.page ?? "About Us";

  return (
    <Wrapper>
      <HeaderOne />
      <div id="smooth-wrapper">
        <div id="smooth-content">
          <Breacrumb title={breadcrumbTitle} page={breadcrumbPage} />
          <AboutArea content={content?.hero} />
          <AboutCounter content={content?.counters} />
          <SolutionsArea content={content?.solutions} />
          <OurWorkArea content={content?.values} />
          <AboutTeam content={content?.team} />
          <AboutCta content={content?.cta} />
          <FooterOne />         
        </div>
      </div>
    </Wrapper>
  )
}
