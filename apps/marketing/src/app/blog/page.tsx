import ThemeSectionList from "@/components/homes/home-1/ThemeSectionList";
import Blog from "@/components/blog";
import FooterOne from "@/layouts/footers/FooterOne";
import HeaderOne from "@/layouts/headers/HeaderOne";
import Wrapper from "@/layouts/Wrapper";
import { getPageSections } from "@/lib/sanity/getPageSections";
import { normalizeEnabledSections } from "@/lib/sanity/sectionUtils";

export const revalidate = 60;

export default async function BlogPage() {
  const { sections, found } = await getPageSections("blog");
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

  return <Blog />;
}
