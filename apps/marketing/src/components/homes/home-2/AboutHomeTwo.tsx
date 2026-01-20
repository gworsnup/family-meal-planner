import Link from "next/link";



export default function AboutHomeTwo() {
  return (
    <>
      <div className="azzle-section-padding pt-0">
        <div className="container">
          <div className="row">
            <div className="col-lg-5">
              <div className="azzle-content-thumb" data-aos="zoom-in" data-aos-delay="500">
                <img src="assets/images/home2/thumb1.png" alt="Thumb" />
                <div className="azzle-content-thumb-bg">
                  <img src="assets/images/home2/shape2.png" alt="shape" />
                </div>
              </div>
            </div>
            <div className="col-lg-7 d-flex align-items-center">
              <div className="azzle-default-content content3 pl-110" data-aos="fade-up" data-aos-delay="700">
                <h2>Expression of like human attitude</h2>
                <p className="mb-0">Our AI chatbots excel at understanding natural language and generating human-like responses. Adapting your conversational style to our chatbot can improve the quality of your interactions.</p>
                <div className="azzle-listicon-wrap2 mt-50">
                  <ul>
                    <li>
                      <h3>Ready-to-use AI capabilities system</h3>
                    </li>
                    <li>
                      <h3>The conversation with a polite greeting</h3>
                    </li>
                    <li>
                      <h3>Feel free to use emotions and expressions</h3>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* <!-- end content --> */}

      <div className="azzle-section-padding pt-0">
        <div className="container">
          <div className="row">
            <div className="col-lg-5 order-lg-2">
              <div className="azzle-content-thumb" data-aos="fade-up" data-aos-delay="500">
                <img src="assets/images/home2/thumb3.png" alt="Thumb" />
                <div className="azzle-content-thumb-bg">
                  <img src="assets/images/home2/shape3.png" alt="shape" />
                </div>
              </div>
            </div>
            <div className="col-lg-7 d-flex align-items-center">
              <div className="azzle-default-content content3 pr-110" data-aos="fade-up" data-aos-delay="700">
                <h2>Faster means of communication</h2>
                <p className="mb-0">This AI chatbot can handle repetitive tasks and also quickly answer frequently asked questions, businesses to save time and resources.</p>
                <div className="azzle-listicon-wrap2 mt-50">
                  <ul>
                    <li>
                      <h3>Provide instant responses any queries</h3>
                    </li>
                    <li>
                      <h3>Engage in multiple conversations at once</h3>
                    </li>
                    <li>
                      <h3>Manage all frequently asked questions</h3>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* <!-- end content --> */}

      <div className="azzle-section-padding pt-0 overflow-hidden">
        <div className="container">
          <div className="row">
            <div className="col-lg-5">
              <div className="azzle-content-thumb" data-aos="fade-left" data-aos-delay="500">
                <img src="assets/images/home2/thumb2.png" alt="Thumb" />
                <div className="azzle-content-thumb-bg">
                  <img src="assets/images/home2/shape3.png" alt="shape" />
                </div>
              </div>
            </div>
            <div className="col-lg-7 d-flex align-items-center">
              <div className="azzle-default-content content3 pl-110" data-aos="fade-up" data-aos-delay="700">
                <h2>Always provide the best answer</h2>
                <p> AI chatbots are designed to give accurate & relevant answers to the best of their abilities based on the information they are trained and algorithms to ensure high-quality responses.</p>
                <p>Our chatbot responses is influenced by the quality and well-trained chatbots are more likely to provide better answers.</p>
                <div className="mt-50" data-aos="fade-up" data-aos-delay="900">
                  <Link className="azzle-default-btn btn3" href="/contact-us" data-text="Try It Now">
                    <span className="button-wraper">Try It Now</span>
                    <svg width="19" height="16" viewBox="0 0 19 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M11.2139 1.5L17.7139 8M17.7139 8L11.2139 14.5M17.7139 8L0.999581 8" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M11.2139 1.5L17.7139 8M17.7139 8L11.2139 14.5M17.7139 8L0.999581 8" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
