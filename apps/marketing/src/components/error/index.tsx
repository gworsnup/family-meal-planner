import FooterOne from "@/layouts/footers/FooterOne";
import HeaderOne from "@/layouts/headers/HeaderOne";
import Wrapper from "@/layouts/Wrapper";
import Link from "next/link";


export default function ErrorPage() {
  return (
    <Wrapper>
      <HeaderOne />
      <div id="smooth-wrapper">
        <div id="smooth-content">
          <div className="azzle-404-section">
            <div className="container">
              <div className="azzle-404-content">
                <img data-aos="fade-up" data-aos-delay="500" src="assets/images/blog/error404.png" alt="404" />
                <h2 data-aos="fade-up" data-aos-delay="700">The page you are looking for cannot be found</h2>
                <div className="mt-50">
                  <Link className="azzle-default-btn" data-aos="fade-up" data-aos-delay="900" href="/" data-text="Go to homepage">
                    <span className="button-wraper">Go to homepage</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <FooterOne />
        </div>
      </div>
    </Wrapper>
  )
}
