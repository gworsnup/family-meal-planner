import Link from "next/link";


export default function HeroHomeTwo() {
  return (
    <div className="azzle-hero-section2 section" style={{ backgroundImage: "url(/assets/images/home2/hero-bg.png)" }}>
      <div className="container">
        <div className="row">
          <div className="col-lg-7">
            <div className="azzle-hero-content2">
              <h1 data-aos="fade-up" data-aos-delay="500">Enhance your communication skills with AI</h1>
              <p data-aos="fade-up" data-aos-delay="700">Meet your customers on the most popular messaging channels with an AI chatbot. It understands the customer experience. Our AI chatbot benefits users by providing instant support, 24/7 availability, and efficient response to queries.</p>
              <div className="mt-50" data-aos="fade-up" data-aos-delay="900">
                <Link className="azzle-default-btn btn2" href="/contact-us" data-text="Start Chatting for Free">
                  <span className="button-wraper">Start Chatting for Free</span>
                  <svg width="19" height="16" viewBox="0 0 19 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11.2139 1.5L17.7139 8M17.7139 8L11.2139 14.5M17.7139 8L0.999581 8" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M11.2139 1.5L17.7139 8M17.7139 8L11.2139 14.5M17.7139 8L0.999581 8" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
          <div className="col-lg-5">
            <div className="azzle-hero-thumb" data-aos="zoom-in" data-aos-delay="500">
              <img src="assets/images/home2/hero-thumb.png" alt="Thumb" />
              <div className="azzle-hero-icon">
                <img src="assets/images/home2/hero-icon.svg" alt="icon" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
