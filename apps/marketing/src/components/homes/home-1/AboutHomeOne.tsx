
type AboutHomeOneProps = {
  content?: any;
};

export default function AboutHomeOne({ content: _content }: AboutHomeOneProps) {
  return (
    <>
      <div className="azzle-section-padding pt-0 overflow-hidden">
        <div className="container">
          <div className="row">
            <div className="col-lg-5">
              <div className="azzle-content-thumb" data-aos="fade-right" data-aos-delay="500">
                <img src="assets/images/home1/thumb2.png" alt="Thumb" />
              </div>
            </div>
            <div className="col-lg-7 d-flex align-items-center">
              <div className="azzle-default-content pl-110" data-aos="fade-left" data-aos-delay="700">
                <h2>Accessible to a wider audience</h2>
                <p>Advanced AI capabilities accessible to a broader audience, including small & medium-sized businesses and individuals who may not have the resources or expertise to develop.</p>
                <p>AI platform are typically accessible via the internet, making services available anywhere with an internet connection.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="azzle-section-padding pt-0 overflow-hidden">
        <div className="container">
          <div className="row">
            <div className="col-lg-5 order-lg-2">
              <div className="azzle-content-thumb" data-aos="zoom-in" data-aos-delay="500">
                <img src="assets/images/home1/thumb1.png" alt="Thumb" />
              </div>
            </div>
            <div className="col-lg-7 d-flex align-items-center">
              <div className="azzle-default-content pr-110" data-aos="fade-up" data-aos-delay="700">
                <h2>Providing quick deploy solutions</h2>
                <p className="mb-0">Our AI SaaS solutions can be quickly deployed, enabling users to start benefiting from AI capabilities without lengthy setup and development times in fast-paced industries.</p>
                <div className="azzle-listicon-wrap mt-50">
                  <ul>
                    <li>
                      <img src="assets/images/home1/arrow.svg" alt="Icon" />
                      <h3>Ready-to-use AI capabilities system</h3>
                    </li>
                    <li>
                      <img src="assets/images/home1/arrow.svg" alt="Icon" />
                      <h3>Users can quickly integrate AI features</h3>
                    </li>
                    <li>
                      <img src="assets/images/home1/arrow.svg" alt="Icon" />
                      <h3>Time savings translate to cost savings</h3>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
