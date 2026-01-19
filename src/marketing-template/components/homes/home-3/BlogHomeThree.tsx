import Link from "next/link";


export default function BlogHomeThree() {
  return (
    <section className="azzle-section-padding2 bg-color">
      <div className="container">
        <div className="azzle-section-title title3 center max-w-1000" data-aos="fade-up" data-aos-delay="500">
          <h2>Discover our latest articles</h2>
        </div>
        <div className="row">
          <div className="col-lg-6">
            <div className="azzle-blog-wrapper" data-aos="fade-up" data-aos-delay="500">
              <div className="azzle-blog-thumb2">
                <Link href="/single-blog">
                  <img src="assets/images/blog/blog4.png" alt="thumb" />
                </Link>
              </div>
              <div className="azzle-blog-wrap2">
                <div className="azzle-blog-meta">
                  <ul>
                    <li>
                      <Link href="/single-blog">BUSINESS</Link>
                    </li>
                    <li>| June 12, 2024</li>
                  </ul>
                </div>
                <div className="azzle-blog-content2">
                  <Link href="/single-blog">
                    <h3>10 AI business ideas for startups in 2024</h3>
                  </Link>
                  <p>Boost business efficiency using AI. Explore AI business ideas...</p>
                </div>
              </div>
            </div>
          </div>
          <div className="col-lg-6">
            <div className="azzle-blog-wrapper" data-aos="fade-up" data-aos-delay="700">
              <div className="azzle-blog-thumb2">
                <Link href="/single-blog">
                  <img src="assets/images/blog/blog5.png" alt="thumb" />
                </Link>
              </div>
              <div className="azzle-blog-wrap2">
                <div className="azzle-blog-meta">
                  <ul>
                    <li>
                      <Link href="/single-blog">OPINION</Link>
                    </li>
                    <li>| June 10, 2024</li>
                  </ul>
                </div>
                <div className="azzle-blog-content2">
                  <Link href="/single-blog">
                    <h3>Steps to shape your future work with AI</h3>
                  </Link>
                  <p>Artificial Intelligence has the potential to revolutionize...</p>
                </div>
              </div>
            </div>
          </div>
          <div className="col-lg-6">
            <div className="azzle-blog-wrapper" data-aos="fade-up" data-aos-delay="900">
              <div className="azzle-blog-thumb2">
                <Link href="/single-blog">
                  <img src="assets/images/blog/blog6.png" alt="thumb" />
                </Link>
              </div>
              <div className="azzle-blog-wrap2">
                <div className="azzle-blog-meta">
                  <ul>
                    <li>
                      <Link href="/single-blog">TECHNOLOGY</Link>
                    </li>
                    <li>| June 09, 2024</li>
                  </ul>
                </div>
                <div className="azzle-blog-content2">
                  <Link href="/single-blog">
                    <h3>AI tools to improve product descriptions</h3>
                  </Link>
                  <p>AI tools are designed to help sellers generate improved...</p>
                </div>
              </div>
            </div>
          </div>
          <div className="col-lg-6">
            <div className="azzle-blog-wrapper" data-aos="fade-up" data-aos-delay="1100">
              <div className="azzle-blog-thumb2">
                <Link href="/single-blog">
                  <img src="assets/images/blog/blog7.png" alt="thumb" />
                </Link>
              </div>
              <div className="azzle-blog-wrap2">
                <div className="azzle-blog-meta">
                  <ul>
                    <li>
                      <Link href="/single-blog">BUSINESS</Link>
                    </li>
                    <li>| June 05, 2024</li>
                  </ul>
                </div>
                <div className="azzle-blog-content2">
                  <Link href="/single-blog">
                    <h3>3 best AI businesses to make money</h3>
                  </Link>
                  <p>Everyone is buzzing about AI & its potential to revolutionize...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
