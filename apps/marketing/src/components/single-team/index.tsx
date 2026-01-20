import Breacrumb from "@/common/Breacrumb";
import FooterOne from "@/layouts/footers/FooterOne";
import HeaderOne from "@/layouts/headers/HeaderOne";
import Wrapper from "@/layouts/Wrapper";
import TeamDetailsArea from "./TeamDetailsArea";

 

export default function SingleTeam() {
  return (
    <Wrapper>
      <HeaderOne />
      <div id="smooth-wrapper">
        <div id="smooth-content">
          <Breacrumb title="Team Details" page="Team Details" />
          <TeamDetailsArea />                     
          <FooterOne />         
        </div>
      </div>
    </Wrapper>
  )
}
