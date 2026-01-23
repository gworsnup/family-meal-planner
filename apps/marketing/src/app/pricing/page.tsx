import ThemeSectionList from "@/components/homes/home-1/ThemeSectionList";
import Pricing from "@/components/pricing";
import FooterOne from "@/layouts/footers/FooterOne";
import HeaderOne from "@/layouts/headers/HeaderOne";
import Wrapper from "@/layouts/Wrapper";
import { getPageSections } from "@/lib/sanity/getPageSections";
import { normalizeEnabledSections } from "@/lib/sanity/sectionUtils";

export const revalidate = 60;

export default async function PricingPage() {
  const { sections, found } = await getPageSections("pricing");
  const enabledSections = normalizeEnabledSections(sections);

  if (found && enabledSections.length > 0) {
    return (
      <Wrapper>
        <HeaderOne />
        <div id="smooth-wrapper">
          <div id="smooth-content">
            <ThemeSectionList sections={enabledSections} />
            <FooterOne />
          </div>
        </div>
      </Wrapper>
    );
  }

  return <Pricing />;
}
