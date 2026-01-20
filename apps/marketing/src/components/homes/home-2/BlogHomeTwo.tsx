import Link from "next/link";



export default function BlogHomeTwo() {
  return (
    <section className="azzle-section-padding2 pt-0">
      <div className="container">
        <div className="azzle-section-title font-title max-w-650" data-aos="fade-right" data-aos-delay="500">
          <h2>Find out more in our recent blogs</h2>
        </div>
        <div className="row">
          <div className="col-xl-4 col-md-6">
            <div className="azzle-blog-wrap" data-aos="fade-up" data-aos-delay="500">
              <div className="azzle-blog-thumb">
                <img src="assets/images/blog/blog1.png" alt="thumb" />
              </div>
              <div className="azzle-blog-content">
                <Link href="/single-blog">
                  <h3>AI Chatbot: It essential for customer self-service</h3>
                </Link>
                <div className="azzle-blog-data-wrap">
                  <div className="azzle-blog-meta">
                    <ul>
                      <li>
                        <Link href="/single-blog">23 June 2024</Link>
                      </li>
                    </ul>
                  </div>
                  <Link className="azzle-blog-btn azzle-icon-hover" href="/single-blog">
                    <img className="hover-icon-show" src="assets/images/blog/arrow.svg" alt="Arrow" />
                    <img className="hover-icon-hide" src="assets/images/blog/arrow.svg" alt="Arrow" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-4 col-md-6">
            <div className="azzle-blog-wrap" data-aos="fade-up" data-aos-delay="700">
              <div className="azzle-blog-thumb">
                <img src="assets/images/blog/blog2.png" alt="thumb" />
              </div>
              <div className="azzle-blog-content">
                <Link href="/single-blog">
                  <h3>How to build your own AI chatbot with custom data</h3>
                </Link>
                <div className="azzle-blog-data-wrap">
                  <div className="azzle-blog-meta">
                    <ul>
                      <li>
                        <Link href="/single-blog">20 June 2024</Link>
                      </li>
                    </ul>
                  </div>
                  <Link className="azzle-blog-btn azzle-icon-hover" href="/single-blog">
                    <img className="hover-icon-show" src="assets/images/blog/arrow.svg" alt="Arrow" />
                    <img className="hover-icon-hide" src="assets/images/blog/arrow.svg" alt="Arrow" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-4 col-md-6">
            <div className="azzle-blog-wrap" data-aos="fade-up" data-aos-delay="900">
              <div className="azzle-blog-thumb">
                <img src="assets/images/blog/blog3.png" alt="thumb" />
              </div>
              <div className="azzle-blog-content">
                <Link href="/single-blog">
                  <h3>8 best AI chatbot tools for boost your business</h3>
                </Link>
                <div className="azzle-blog-data-wrap">
                  <div className="azzle-blog-meta">
                    <ul>
                      <li>
                        <Link href="/single-blog">18 June 2024</Link>
                      </li>
                    </ul>
                  </div>
                  <Link className="azzle-blog-btn azzle-icon-hover" href="/single-blog">
                    <img className="hover-icon-show" src="assets/images/blog/arrow.svg" alt="Arrow" />
                    <img className="hover-icon-hide" src="assets/images/blog/arrow.svg" alt="Arrow" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
