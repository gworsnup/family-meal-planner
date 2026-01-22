import type { SanityPage } from "@/lib/sanity/types";
import Wrapper from "@/layouts/Wrapper";
import HeaderOne from "@/layouts/headers/HeaderOne";
import FooterOne from "@/layouts/footers/FooterOne";
import SectionRenderer from "@/components/cms/SectionRenderer";

const CMSHomePage = ({ page }: { page: SanityPage }) => {
  return (
    <Wrapper>
      <HeaderOne />
      <div id="smooth-wrapper">
        <div id="smooth-content">
          <SectionRenderer sections={page.sections} />
          <FooterOne />
        </div>
      </div>
    </Wrapper>
  );
};

export default CMSHomePage;
