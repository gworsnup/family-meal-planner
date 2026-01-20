import FeaturesHomeOne from "@/components/homes/home-1/FeaturesHomeOne";
import FooterOne from "@/layouts/footers/FooterOne";
import HeaderOne from "@/layouts/headers/HeaderOne";
import Wrapper from "@/layouts/Wrapper";

export default function FeaturesPage() {
  return (
    <Wrapper>
      <HeaderOne />
      <div id="smooth-wrapper">
        <div id="smooth-content">
          <FeaturesHomeOne />
          <FooterOne />
        </div>
      </div>
    </Wrapper>
  );
}
