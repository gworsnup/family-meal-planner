
import HeaderThree from '@/layouts/headers/HeaderThree'
import Wrapper from '@/layouts/Wrapper' 
import HeroHomeThree from './HeroHomeThree'
import AboutHomeThree from './AboutHomeThree'
import TeamHomeThree from './TeamHomeThree'
import TestimonialHomeThree from './TestimonialHomeThree'
import BlogHomeThree from './BlogHomeThree'
import FooterThree from '@/layouts/footers/FooterThree'

export default function HomeThree() {
  return (
    <Wrapper>
      <HeaderThree />
      <div id="smooth-wrapper">
        <div id="smooth-content">
          <HeroHomeThree /> 
          <AboutHomeThree />
          <TeamHomeThree />
          <TestimonialHomeThree />
          <BlogHomeThree />
          <FooterThree />
        </div>
      </div>
    </Wrapper>
  )
}
