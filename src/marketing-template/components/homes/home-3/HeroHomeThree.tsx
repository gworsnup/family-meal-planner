import Link from "next/link";


export default function HeroHomeThree() {
  return (
    <div className="azzle-hero-section3 section" style={{ backgroundImage: "url(/assets/images/home3/hero-bg.png)" }}>
      <div className="container">
        <div className="azzle-section-title">
          <div className="row">
            <div className="col-lg-7">
              <div className="azzle-hero-content3" data-aos="fade-up" data-aos-delay="500">
                <h1>AI the future of business</h1>
              </div>
            </div>
            <div className="col-lg-5">
              <div className="azzle-hero-content3" data-aos="fade-up" data-aos-delay="700">
                <p>Businesses harnessing AI's power are better positioned to thrive in the modern age. It can drive decision-making skills.</p>
                <div className="mt-50">
                  <Link href="/about-us" className="azzle-default-btn outline-btn3">Explore About Us</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="azzle-hero-thumb3" data-aos="fade-up" data-aos-delay="500">
        <img src="assets/images/home3/hero-thumb.png" alt="Thumb" />
      </div>
      <div className="pt-130">
        <div className="container">
          <div className="azzle-section-title title3 center max-w-1000" data-aos="fade-up" data-aos-delay="500">
            <h2>Way to be a game changer</h2>
          </div>
          <div className="row">
            <div className="col-xl-4 col-md-6">
              <div className="azzle-iconbox-wrap4" data-aos="fade-up" data-aos-delay="500">
                <div className="azzle-iconbox-icon4">
                  <img src="assets/images/home3/icon2.svg" alt="Icon" />
                </div>
                <div className="azzle-iconbox-content4">
                  <h3>Enhanced Decision-Making</h3>
                  <p>AI can uncover valuable insights, for an identify trends, & predict outcomes. AI empowers data-driven decisions.</p>
                </div>
              </div>
            </div>
            <div className="col-xl-4 col-md-6">
              <div className="azzle-iconbox-wrap4" data-aos="fade-up" data-aos-delay="700">
                <div className="azzle-iconbox-icon4">
                  <img src="assets/images/home3/icon1.svg" alt="Icon" />
                </div>
                <div className="azzle-iconbox-content4">
                  <h3>Efficiency and Automation</h3>
                  <p>AI driven automation can be applied to the various processes leading to cost savings & improved productivity.</p>
                </div>
              </div>
            </div>
            <div className="col-xl-4 col-md-6">
              <div className="azzle-iconbox-wrap4 mb-0" data-aos="fade-up" data-aos-delay="900">
                <div className="azzle-iconbox-icon4">
                  <img src="assets/images/home3/icon3.svg" alt="Icon" />
                </div>
                <div className="azzle-iconbox-content4">
                  <h3>Customer Experiences</h3>
                  <p>It enables businesses to provide highly personalized and responsive innovative best customer experiences.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
