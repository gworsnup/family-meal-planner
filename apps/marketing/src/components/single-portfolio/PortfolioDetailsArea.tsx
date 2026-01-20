
export default function PortfolioDetailsArea() {
  return (
    <>
      <div className="azzle-section-pt overflow-hidden">
        <div className="container">
          <div className="azzle-section-title max-width-780" data-aos="fade-left" data-aos-delay="500">
            <h2>Natural language processing models</h2>
          </div>
          <div className="azzle-portfolio-details-top">
            <div className="azzle-portfolio-details-thumb">
              <img src="assets/images/portfolio/portfolio-main-img.jpg" alt="Portfolio Thumb" />
            </div>
            <div className="azzle-portfolio-details-info">
              <div className="azzle-portfolio-details-item">
                <p>Client:</p>
                <h3>XYZ Company</h3>
              </div>
              <div className="azzle-portfolio-details-item">
                <p>Services:</p>
                <h3>Web Design</h3>
              </div>
              <div className="azzle-portfolio-details-item">
                <p>Duration:</p>
                <h3>2 Weeks</h3>
              </div>
              <div className="azzle-portfolio-details-item">
                <p>Website</p>
                <a href="#">Live preview <img src="assets/images/portfolio/arrow-right.png" alt="Portfolio Icon" /> </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* <!-- End section --> */}

      <div className="azzle-section-pb overflow-hidden">
        <div className="container">
          <div className="azzle-pb-80">
            <div className="row">
              <div className="col-lg-6">
                <div className="azzle-content-thumb pr50" data-aos="fade-right" data-aos-delay="500">
                  <img src="assets/images/portfolio/content-image-5.jpg" alt="Thumb" />
                </div>
              </div>
              <div className="col-lg-6 d-flex align-items-center">
                <div className="azzle-default-content" data-aos="fade-up" data-aos-delay="700">
                  <h2>Project overview</h2>
                  <h4>Machine Learning and Predictive Analytics:</h4>
                  <ul>
                    <li>Demand Forecasting: AI SaaS helps businesses predict demand for products and services, optimizing inventory management and supply chain operations.</li>
                    <li>Customer Churn Prediction: It's used to identify customers at risk of leaving a service or product, allowing proactive retention efforts.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-lg-6 order-lg-2">
              <div className="azzle-content-thumb pl50" data-aos="fade-left" data-aos-delay="500">
                <img src="assets/images/portfolio/content-image-6.jpg" alt="Thumb" />
              </div>
            </div>
            <div className="col-lg-6 d-flex align-items-center">
              <div className="azzle-default-content" data-aos="fade-up" data-aos-delay="700">
                <h2>Project results</h2>
                <h4>Natural Language Processing (NLP):</h4>
                <ul>
                  <li>Text Analysis: AI SaaS can be used to analyze text data for sentiment analysis, entity recognition, language translation, and text summarization.</li>
                  <li>Chatbots and Virtual Assistants: Businesses use AI SaaS to build chatbots and virtual assistants for customer support, improving response times and efficiency.</li>
                </ul>
              </div>
            </div>
          </div>

        </div>
      </div>
      {/* <!-- end content --> */}


      <div className="azzle-content-section overflow-hidden">
        <div className="container">
          <div className="row gx-5">
            <div className="col-lg-5">
              <div className="azzle-content-thumb" data-aos="fade-right" data-aos-delay="500">
                <img src="assets/images/about/image-3.png" alt="Thumb" />
              </div>
            </div>
            <div className="col-lg-7 d-flex align-items-center">
              <div className="azzle-default-content w-100 light-color pl-30" data-aos="fade-up" data-aos-delay="700">
                <h2>We always want to connect our clients</h2>
                <p>AI accessible and beneficial for organizations, and we look forward to partnering with businesses to achieve their AI goals.</p>

                <div className="mt-50">
                  <div className="azzle-contact-info">
                    <ul>
                      <li>Website:<a href="">www.example.com</a></li>
                      <li>Email:<a href="">info@example.com</a></li>
                      <li>Phone:<a href="">(123) 456-7890</a></li>
                    </ul>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
