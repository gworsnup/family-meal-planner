

export default function ServiceDetailsArea() {
  return (
    <>
      <div className="azzle-section-padding">
        <div className="container">
          <div className="row">
            <div className="col-xl-5 col-lg-5 offset-xl-1 offset-lg-0 order-lg-2">
              <div className="azzle-content-thumb" data-aos="fade-left" data-aos-delay="500">
                <img src="assets/images/home1/thumb2.png" alt="Thumb" />
              </div>
            </div>
            <div className="col-xl-6 col-lg-7 d-flex align-items-center">
              <div className="azzle-default-content" data-aos="fade-up" data-aos-delay="700">
                <h2>Analyze any data perfectly with AI</h2>
                <p>AI data analysis, also known as artificial intelligence data analysis or AI-driven data analysis, refers to the process of using artificial intelligence and machine learning techniques.</p>
                <div className="mt-50">
                  <div className="azzle-service-box-column">
                    <div className="azzle-service-box">
                      <img src="assets/images/service/data.png" alt="Thumb" />
                      <h3>Data Preprocessing</h3>
                      <p>AI data analysis can begin, and raw data must be collected, cleaned.</p>
                    </div>
                    <div className="azzle-service-box">
                      <img src="assets/images/service/setting.png" alt="Thumb" />
                      <h3>Predictive Analytics</h3>
                      <p>Algorithms use historical data to forecast future trends, behaviors.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* <!-- end content --> */}

      <div className="azzle-section-pb">
        <div className="container">
          <div className="azzle-section-title center max-width-850" data-aos="fade-up" data-aos-delay="500">
            <h2>Widely used throughout the industry for work</h2>
          </div>
          <div className="row">
            <div className=" col-lg-5">
              <div className="azzle-content-thumb" data-aos="fade-right" data-aos-delay="500">
                <img src="assets/images/service/target.png" alt="Thumb" />
              </div>
            </div>
            <div className="col-lg-6 offset-lg-1 d-flex align-items-center">
              <div className="azzle-target-list-wrap">
                <div className="azzle-target-list" data-aos="fade-up" data-aos-delay="500">
                  <h3>1. Businesses and Corporations:</h3>
                  <p>Businesses use AI data analysis to gain competitive advantages, optimize operations, & make data-driven decisions. This includes industries such as retail, finance, manufacturing.</p>
                </div>
                <div className="azzle-target-list" data-aos="fade-up" data-aos-delay="700">
                  <h3>2. Data Scientists and Analysts:</h3>
                  <p>Data scientists and analysts leverage AI tools and algorithms to extract actionable insights from large datasets. They alsouse AI for predictive modeling, anomaly detection, and data visualization.</p>
                </div>
                <div className="azzle-target-list" data-aos="fade-up" data-aos-delay="900">
                  <h3>3. Government and Public Sector:</h3>
                  <p>Government agencies use AI data analysis for various purposes, including public policy development, law enforcement, urban planning, and disaster.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
