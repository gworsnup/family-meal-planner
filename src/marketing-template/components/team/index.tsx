
import Breacrumb from '@/common/Breacrumb'
import FooterOne from '@/layouts/footers/FooterOne'
import HeaderOne from '@/layouts/headers/HeaderOne'
import Wrapper from '@/layouts/Wrapper' 
import TeamArea from './TeamArea'

export default function Team() {
  return (
    <Wrapper>
      <HeaderOne />
      <div id="smooth-wrapper">
        <div id="smooth-content">
          <Breacrumb title="Our Team" page="Our Team" />
          <TeamArea />           
          <FooterOne />         
        </div>
      </div>
    </Wrapper>
  )
}
