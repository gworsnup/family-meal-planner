import Link from "next/link";



export default function PortfolioArea() {
  return (
    <div className="azzle-section-padding6">
      <div className="container">
        <div className="azzle-section-title center max-width-750" data-aos="fade-up" data-aos-delay="500">
          <h2>Valuable AI projects for new generation</h2>
        </div>
        <div className="row">
          <div className="col-lg-6">
            <div className="azzle-portfolio-column">
              <Link href="/single-portfolio" data-aos="fade-up" data-aos-delay="500">
                <div className="azzle-portfolio-box">
                  <div className="azzle-portfolio-thumb">
                    <img src="assets/images/portfolio/portfolio-img-1.jpg" alt="Portfolio Thumb" />
                  </div>
                  <div className="azzle-portfolio-content">
                    <h3>Natural language processing models to extract insights</h3>
                    <div className="azzle-portfolio-icon">
                      <svg width="37" height="31" viewBox="0 0 37 31" fill="none">
                        <path d="M22.25 2.375L35.375 15.5M35.375 15.5L22.25 28.625M35.375 15.5L1.625 15.5" stroke="black" strokeWidth="3" strokeLinecap="round" stroke-linejoin="round" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
              <Link href="/single-portfolio" data-aos="fade-up" data-aos-delay="700">
                <div className="azzle-portfolio-box">
                  <div className="azzle-portfolio-thumb">
                    <img src="assets/images/portfolio/portfolio-img-2.jpg" alt="Portfolio Thumb" />
                  </div>
                  <div className="azzle-portfolio-content">
                    <h3>Develop a content generation system that uses AI system</h3>
                    <div className="azzle-portfolio-icon">
                      <svg width="37" height="31" viewBox="0 0 37 31" fill="none">
                        <path d="M22.25 2.375L35.375 15.5M35.375 15.5L22.25 28.625M35.375 15.5L1.625 15.5" stroke="black" strokeWidth="3" strokeLinecap="round" stroke-linejoin="round" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
              <Link href="/single-portfolio" data-aos="fade-up" data-aos-delay="900">
                <div className="azzle-portfolio-box">
                  <div className="azzle-portfolio-thumb">
                    <img src="assets/images/portfolio/portfolio-img-3.jpg" alt="Portfolio Thumb" />
                  </div>
                  <div className="azzle-portfolio-content">
                    <h3>Build an AI solution for precision agriculture</h3>
                    <div className="azzle-portfolio-icon">
                      <svg width="37" height="31" viewBox="0 0 37 31" fill="none">
                        <path d="M22.25 2.375L35.375 15.5M35.375 15.5L22.25 28.625M35.375 15.5L1.625 15.5" stroke="black" strokeWidth="3" strokeLinecap="round" stroke-linejoin="round" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>
          <div className="col-lg-6">
            <div className="azzle-portfolio-column">
              <Link href="/single-portfolio" data-aos="fade-up" data-aos-delay="600">
                <div className="azzle-portfolio-box">
                  <div className="azzle-portfolio-thumb">
                    <img src="assets/images/portfolio/portfolio-img-4.jpg" alt="Portfolio Thumb" />
                  </div>
                  <div className="azzle-portfolio-content">
                    <h3>Create an modern AI-powered educational platform</h3>
                    <div className="azzle-portfolio-icon">
                      <svg width="37" height="31" viewBox="0 0 37 31" fill="none">
                        <path d="M22.25 2.375L35.375 15.5M35.375 15.5L22.25 28.625M35.375 15.5L1.625 15.5" stroke="black" strokeWidth="3" strokeLinecap="round" stroke-linejoin="round" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
              <Link href="/single-portfolio" data-aos="fade-up" data-aos-delay="800">
                <div className="azzle-portfolio-box">
                  <div className="azzle-portfolio-thumb">
                    <img src="assets/images/portfolio/portfolio-img-5.jpg" alt="Portfolio Thumb" />
                  </div>
                  <div className="azzle-portfolio-content">
                    <h3>Implement a predictive maintenance system with AI</h3>
                    <div className="azzle-portfolio-icon">
                      <svg width="37" height="31" viewBox="0 0 37 31" fill="none">
                        <path d="M22.25 2.375L35.375 15.5M35.375 15.5L22.25 28.625M35.375 15.5L1.625 15.5" stroke="black" strokeWidth="3" strokeLinecap="round" stroke-linejoin="round" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
              <Link href="/single-portfolio" data-aos="fade-up" data-aos-delay="1000">
                <div className="azzle-portfolio-box">
                  <div className="azzle-portfolio-thumb">
                    <img src="assets/images/portfolio/portfolio-img-6.jpg" alt="Portfolio Thumb" />
                  </div>
                  <div className="azzle-portfolio-content">
                    <h3>AI for large corporations and businesses across industries</h3>
                    <div className="azzle-portfolio-icon">
                      <svg width="37" height="31" viewBox="0 0 37 31" fill="none">
                        <path d="M22.25 2.375L35.375 15.5M35.375 15.5L22.25 28.625M35.375 15.5L1.625 15.5" stroke="black" strokeWidth="3" strokeLinecap="round" stroke-linejoin="round" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
