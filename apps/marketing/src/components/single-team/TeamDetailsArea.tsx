import Link from "next/link";


export default function TeamDetailsArea() {
  return (
    <div className="azzle-section-padding6 overflow-hidden">
      <div className="container">
        <div className="azzle-single-team-top">
          <div className="row">
            <div className="col-lg-7 d-flex align-items-center">
              <div className="azzle-default-content responsive-mb-40" data-aos="fade-up" data-aos-delay="700">
                <h2>Mr. Abraham Maslo</h2>
                <p>As the Chief AI Officer at Mthemeus, Mr. Abraham is at the forefront of harnessing the power of artificial intelligence (AI) to drive innovation and transform our business landscape.</p>
                <p>With a background in AI tech expert, he is leads our AI strategy, overseeing the development and implementation of cutting-edge AI and also machine learning initiatives. With a passion for technology and a track record of successful AI projects in our company's journey.</p>
                <p className="font-semibold">Here's an overview of the role and responsibilities of a Chief AI Officer:</p>
              </div>
            </div>
            <div className="col-lg-4 offset-lg-1">
              <div className="azzle-team-wrap wrap2 m-0" data-aos="fade-left" data-aos-delay="700">
                <Link href="/single-team">
                  <div className="azzle-team-thumb">
                    <img src="assets/images/team/team8.png" alt="Thumb" />
                  </div>
                  <div className="azzle-team-content">
                    <h3>Homi Corn</h3>
                  </div>
                </Link>
                <div className="azzle-team-author-wrap">
                  <div className="azzle-team-author-data">
                    <p>HR Manager</p>
                  </div>
                  <div className="azzle-social-wrap2 social-hover-orange">
                    <ul>
                      <li>
                        <a href="https://www.facebook.com">
                          <img src="assets/images/home2/facebook.svg" alt="Icon" />
                        </a>
                      </li>
                      <li>
                        <a href="https://www.twitter.com">
                          <img src="assets/images/home2/twitter.svg" alt="Icon" />
                        </a>
                      </li>
                      <li>
                        <a href="https://www.instagram.com">
                          <img src="assets/images/home2/insta.svg" alt="Icon" />
                        </a>
                      </li>
                      <li>
                        <a href="https://www.linkedin.com">
                          <img src="assets/images/home2/in.svg" alt="Icon" />
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="azzle-single-team-bottom">
          <div className="azzle-single-content" data-aos="fade-up" data-aos-delay="500">
            <h3>1. AI Strategy:</h3>
            <p>The CAIO plays a pivotal role in shaping the organization's AI strategy. They work closely with senior leadership.</p>
          </div>
          <div className="azzle-single-content" data-aos="fade-up" data-aos-delay="700">
            <h3>2. Technology Evaluation:</h3>
            <p>He assess emerging AI technologies, tools, and platforms to determine which ones are suitable for the organization.</p>
          </div>
          <div className="azzle-single-content" data-aos="fade-up" data-aos-delay="900">
            <h3>3. AI Project Oversight:</h3>
            <p>The CAIO oversees the planning and execution of AI & ML projects throughout the organization.</p>
          </div>
          <div className="azzle-single-content" data-aos="fade-up" data-aos-delay="1100">
            <h3>4. Data Management:</h3>
            <p>Data is a critical component of AI, and the CAIO often manages the organization's data strategy.</p>
          </div>
          <div className="azzle-single-content" data-aos="fade-up" data-aos-delay="1300">
            <h3>5. Risk Management:</h3>
            <p>He is also responsible for identifying and mitigating AI-related risks, including also ethical considerations</p>
          </div>
          <div className="azzle-single-content" data-aos="fade-up" data-aos-delay="1500">
            <h3>6. Innovation:</h3>
            <p>The CAIO fosters a culture of innovation by encouraging experimentation with AI technologies, promoting research.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
