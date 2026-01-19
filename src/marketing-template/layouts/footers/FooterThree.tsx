import Link from "next/link";



export default function FooterThree() {
  return (
    <footer className="azzle-section-padding bg-heading">
      <div className="container">
        <div className="azzle-footer-top3">
          <div className="row">
            <div className="col-lg-6">
              <div className="azzle-cta-title3" data-aos="fade-up" data-aos-delay="500">
                <h1>Let’s talk</h1>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="azzle-cta-content3" data-aos="fade-up" data-aos-delay="700">
                <p>Together, we'll create a tailored plan to ensure your success. We'll breathe life into your brand. We work hand in hand to bring your dreams to fruition."</p>
              </div>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-xl-4 col-lg-6">
            <div className="azzle-cta-contact-info" data-aos="fade-up" data-aos-delay="500">
              <ul>
                <li>
                  <a href="mailto:name@email.com">example@gmail.com</a>
                </li>
              </ul>
            </div>
          </div>
          <div className="col-xl-4 col-lg-6">
            <div className="azzle-cta-contact-info" data-aos="fade-up" data-aos-delay="700">
              <ul>
                <li>
                  <a href="tel:123">+088-3457-9210</a>
                </li>
              </ul>
            </div>
          </div>
          <div className="col-xl-4 col-lg-6">
            <div className="azzle-cta-contact-info info2" data-aos="fade-up" data-aos-delay="700">
              <ul>
                <li>
                  4140 Parker Rd. Mexico
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="azzle-footer-three">
          <div className="azzle-footer-textarea textarea3">
            <Link href="/">
              <img src="assets/images/logo/logo-white.svg" alt="Logo" />
            </Link>
            <p>Our mission is to harness the power of AI to solve complex business challenges & decision-makers with data-driven insights, and enhance user experiences across digital platforms.</p>
            <p>© Copyright 2025, All Rights Reserved by favdevs</p>
          </div>
          <div className="azzle-footer-three-right">
            <div className="azzle-footer-menu2">
              <h4>Primary Pages</h4>
              <ul>
                <li>
                  <Link href="/">Home</Link>
                </li>
                <li>
                  <Link href="/about-us">About Us</Link>
                </li>
                <li>
                  <Link href="/service">Services</Link>
                </li>
                <li>
                  <Link href="/pricing">Pricing</Link>
                </li>
                <li>
                  <Link href="/contact-us">Contact</Link>
                </li>
              </ul>
            </div>
            <div className="azzle-footer-menu2">
              <h4>Utility pages</h4>
              <ul>
                <li>
                  <Link href="/faq">Faq</Link>
                </li>
                <li>
                  <Link href="/sign-up">Sign Up</Link>
                </li>
                <li>
                  <Link href="/sign-in">Sign In</Link>
                </li>
                <li>
                  <Link href="/reset-password">Reset Password</Link>
                </li>

                <li>
                  <Link href="/errors-404">404 Not found</Link>
                </li>
              </ul>
            </div>
            <div className="azzle-footer-menu2">
              <h4>Socials</h4>
              <div className="azzle-social-wrap">
                <ul>
                  <li>
                    <a className="wrap" href="https://www.facebook.com">
                      <img src="assets/images/home2/facebook.svg" alt="Icon" />
                    </a>
                    <a className="wrap2" href="https://www.facebook.com">Facebook</a>
                  </li>
                  <li>
                    <a className="wrap" href="https://www.twitter.com">
                      <img src="assets/images/home2/twitter.svg" alt="Icon" />
                    </a>
                    <a className="wrap2" href="https://www.twitter.com">Twitter</a>
                  </li>
                  <li>
                    <a className="wrap" href="https://www.instagram.com">
                      <img src="assets/images/home2/insta.svg" alt="Icon" />
                    </a>
                    <a className="wrap2" href="https://www.instagram.com">Instagram</a>
                  </li>
                  <li>
                    <a className="wrap" href="https://www.linkedin.com">
                      <img src="assets/images/home2/in.svg" alt="Icon" />
                    </a>
                    <a className="wrap2" href="https://www.bd.linkedin.com">Linkedin</a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
