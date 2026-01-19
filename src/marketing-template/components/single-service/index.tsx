import Breacrumb from "@/common/Breacrumb";
import FooterOne from "@/layouts/footers/FooterOne";
import HeaderOne from "@/layouts/headers/HeaderOne";
import Wrapper from "@/layouts/Wrapper";
import ServiceDetailsArea from "./ServiceDetailsArea";
import VideoHomeOne from "../homes/home-1/VideoHomeOne";
import ServiceInfo from "./ServiceInfo";
import AboutCta from "../about-us/AboutCta";


export default function SingleService() {
  return (
    <Wrapper>
      <HeaderOne />
      <div id="smooth-wrapper">
        <div id="smooth-content">
          <Breacrumb title="Services Details" page="Services Details" />
          <ServiceDetailsArea />
          <VideoHomeOne />
          <ServiceInfo />
          <AboutCta />
          <FooterOne />
        </div>
      </div>
    </Wrapper>
  )
}
