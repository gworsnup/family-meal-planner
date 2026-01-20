import Link from "next/link";



export default function BlogArea() {
  return (
    <div className="section azzle-section-padding6">
      <div className="container">
        <div className="row">
          <div className="col-lg-8">
            <div className="row">
              <div className="col-xl-6">
                <div className="single-post-item" data-aos="fade-up" data-aos-delay="500">
                  <div className="post-thumbnail">
                    <img src="assets/images/blog/blog1.png" alt="" />
                  </div>
                  <div className="post-content">
                    <div className="post-meta">
                      <div className="post-category">
                        <a href="#">Marketing</a>
                      </div>
                      <div className="post-date">
                        June 18, 2025
                      </div>
                    </div>
                    <Link href="/single-blog">
                      <h3 className="entry-title">
                        10 ways to supercharge startup with AI integration
                      </h3>
                    </Link>
                    <p>The rapid advancements in AI have paved the way for startups to revolutionize...</p>
                  </div>
                </div>
              </div>
              <div className="col-xl-6">
                <div className="single-post-item" data-aos="fade-up" data-aos-delay="600">
                  <div className="post-thumbnail">
                    <img src="assets/images/blog/blog2.png" alt="" />
                  </div>
                  <div className="post-content">
                    <div className="post-meta">
                      <div className="post-category">
                        <a href="#">Business</a>
                      </div>
                      <div className="post-date">
                        June 16, 2025
                      </div>
                    </div>
                    <Link href="/single-blog">
                      <h3 className="entry-title">
                        Testing AI tools to improve product descriptions
                      </h3>
                    </Link>
                    <p>Amazon is currently testing generative artificial intelligence (AI) tools for...</p>
                  </div>
                </div>
              </div>
              <div className="col-xl-6">
                <div className="single-post-item" data-aos="fade-up" data-aos-delay="700">
                  <div className="post-thumbnail">
                    <img src="assets/images/blog/blog3.png" alt="" />
                  </div>
                  <div className="post-content">
                    <div className="post-meta">
                      <div className="post-category">
                        <a href="#">Technology</a>
                      </div>
                      <div className="post-date">
                        June 14, 2025
                      </div>
                    </div>
                    <Link href="/single-blog">
                      <h3 className="entry-title">
                        3 best AI businesses to make money with in 2024
                      </h3>
                    </Link>
                    <p>Everyone is buzzing about AI and its potential to revolutionize the business...</p>
                  </div>
                </div>
              </div>
              <div className="col-xl-6">
                <div className="single-post-item" data-aos="fade-up" data-aos-delay="800">
                  <div className="post-thumbnail">
                    <img src="assets/images/blog/blog8.png" alt="" />
                  </div>
                  <div className="post-content">
                    <div className="post-meta">
                      <div className="post-category">
                        <a href="#">Solutions</a>
                      </div>
                      <div className="post-date">
                        June 12, 2025
                      </div>
                    </div>
                    <Link href="/single-blog">
                      <h3 className="entry-title">
                        Phrase gives AI-generated content for me at a glance
                      </h3>
                    </Link>
                    <p>While this is incredibly rewarding and has sharpened my editorial skills...</p>
                  </div>
                </div>
              </div>
              <div className="col-xl-6">
                <div className="single-post-item" data-aos="fade-up" data-aos-delay="900">
                  <div className="post-thumbnail">
                    <img src="assets/images/blog/blog9.png" alt="" />
                  </div>
                  <div className="post-content">
                    <div className="post-meta">
                      <div className="post-category">
                        <a href="#">Brand</a>
                      </div>
                      <div className="post-date">
                        June 18, 2025
                      </div>
                    </div>
                    <Link href="/single-blog">
                      <h3 className="entry-title">
                        Testing out Stabilization AI's free image editing tool
                      </h3>
                    </Link>
                    <p>Stability AI is the company that created an open-source AI image generator...</p>
                  </div>
                </div>
              </div>
              <div className="col-xl-6">
                <div className="single-post-item" data-aos="fade-up" data-aos-delay="1000">
                  <div className="post-thumbnail">
                    <img src="assets/images/blog/blog10.png" alt="" />
                  </div>
                  <div className="post-content">
                    <div className="post-meta">
                      <div className="post-category">
                        <a href="#">Business</a>
                      </div>
                      <div className="post-date">
                        June 22, 2025
                      </div>
                    </div>
                    <Link href="/single-blog">
                      <h3 className="entry-title">
                        How to started using AI-based tools as a designer
                      </h3>
                    </Link>
                    <p>Acting on Jakob Nielsen’s stunning prediction of AI being the future...</p>
                  </div>
                </div>
              </div>
            </div>

            {/* <!-- navigation --> */}
            <div className="azzle-navigation">
              <nav className="navigation pagination" aria-label="Posts">
                <div className="nav-links">
                  <span aria-current="page" className="page-numbers current">1</span>
                  <a className="page-numbers" href="#">2</a>
                  <a className="page-numbers" href="#">3</a>
                  <a className="next page-numbers" href="#">
                    <img src="assets/images/blog/angle.png" alt="" />
                  </a>
                </div>
              </nav>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="right-sidebar" data-aos="fade-up" data-aos-delay="500">
              <div className="widget">
                <div className="wp-block-search__inside-wrapper">
                  <input type="search" placeholder="Type keyword here" className="wp-block-search__input" />
                  <button id="wp-block-search__button" type="submit">
                    <img src="assets/images/blog/search.png" alt="" />
                  </button>
                </div>
              </div>
              <div className="widget">
                <h3 className="wp-block-heading">Categories:</h3>
                <ul>
                  <li><a href="#">Business</a></li>
                  <li><a href="#">Development</a></li>
                  <li><a href="#">Technology</a></li>
                  <li><a href="#">Creative Director</a></li>
                  <li><a href="#">Uncategorized</a></li>
                </ul>
              </div>
              <div className="widget azzle_recent_posts_Widget">
                <h3 className="wp-block-heading">Recent Posts:</h3>
                <Link className="post-item" href="/single-blog">
                  <div className="post-thumb">
                    <img src="assets/images/blog/blog1.png" alt="" />
                  </div>
                  <div className="post-text">
                    <div className="post-date">
                      June 18, 2024
                    </div>
                    <p>6 profitable AI tech businesses to start </p>
                  </div>
                </Link>

                <Link className="post-item" href="/single-blog">
                  <div className="post-thumb">
                    <img src="assets/images/blog/blog2.png" alt="" />
                  </div>
                  <div className="post-text">
                    <div className="post-date">
                      June 18, 2024
                    </div>
                    <p>Why i decided to sell my B2B SaaS AI business</p>
                  </div>
                </Link>

                <Link className="post-item" href="/single-blog">
                  <div className="post-thumb">
                    <img src="assets/images/blog/blog3.png" alt="" />
                  </div>
                  <div className="post-text">
                    <div className="post-date">
                      June 18, 2024
                    </div>
                    <p>8 AI tools that will your streamline </p>
                  </div>
                </Link>
              </div>
              <div className="widget">
                <h3 className="wp-block-heading">Tags:</h3>
                <div className="wp-block-tag-cloud">
                  <a href="#">Marketing</a>
                  <a href="#">Business</a>
                  <a href="#">Solutions</a>
                  <a href="#">Studio</a>
                  <a href="#">Brand</a>
                </div>
              </div>
              <div className="widget">
                <h3 className="wp-block-heading">Subscribe</h3>
                <p>Subscribe to our newsletter and get the latest news updates lifetime</p>
                <form action="#">
                  <div className="azzle-blog-subscriber">
                    <input type="email" placeholder="Enter your email address" />
                    <button id="azzle-blog-subscribe" type="button">Subscribe Now</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
