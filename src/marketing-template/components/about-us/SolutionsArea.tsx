import Link from "next/link";

export default function SolutionsArea() {
  return (
    <div className="azzle-section-padding">
      <div className="container">
        <div className="row">
          <div className="col-lg-5 order-lg-2">
            <div className="azzle-content-thumb" data-aos="zoom-in" data-aos-delay="500">
              <img src="assets/images/about/about-image.png" alt="Thumb" />
            </div>
          </div>
          <div className="col-lg-7 d-flex align-items-center">
            <div className="azzle-default-content pr50" data-aos="fade-up" data-aos-delay="700">
              <h2>Delivering the best solutions with AI</h2>
              <p>Our mission is to empower businesses with AI-powered solutions that increase productivity, improve decision-making and drive growth. </p>
              <p className="mb-0">Since 2016 we have been passionate about helping our clients harness With a team of AI experts and data scientists their full potential & stay competitive in an increasingly digital world.</p>
              <div className="mt-50">
                <Link className="azzle-default-btn aos-init aos-animate" data-aos="fade-up" data-aos-delay="700" href="/contact-us" data-text="Get in touch">
                  <span className="button-wraper">Get in touch</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
