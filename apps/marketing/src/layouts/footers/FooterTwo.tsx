import Link from "next/link";

export default function FooterTwo() {
  return (
    <footer className="azzle-footer-section2 section overflow-hidden" style={{ backgroundImage: "url(/assets/images/home2/footer-bg.png)" }}>
      <div className="azzle-footer-top">
        <div className="azzle-cta-section2">
          <div className="container">
            <div className="azzle-section-title title2 font-title center max-width-780 pb-0" data-aos="fade-up" data-aos-delay="500">
              <h2>Let's get started and enjoy the power of AI</h2>
              <div className="azzle-subscribe-field2 mt-50">
                <input type="email" placeholder="Enter your email" />
                <button className="sub-btn2 azzle-default-btn btn4" type="submit" data-text="Get Started">
                  <span className="button-wraper">Get Started</span>
                  <svg width="19" height="16" viewBox="0 0 19 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11.2139 1.5L17.7139 8M17.7139 8L11.2139 14.5M17.7139 8L0.999581 8" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M11.2139 1.5L17.7139 8M17.7139 8L11.2139 14.5M17.7139 8L0.999581 8" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="container">
        <div className="azzle-footer-two">
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
            <h4>Company</h4>
            <ul>
              <li>
                <Link href="/portfolio">Portfolio</Link>
              </li>
              <li>
                <Link href="/team">Team</Link>
              </li>
              <li>
                <Link href="/service">Blog</Link>
              </li>
              <li>
                <Link href="/single-blog">Blog Details</Link>
              </li>
              <li>
                <Link href="/single-portfolio">portfolio Details </Link>
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
                <a href="errors-404">404 Not found</a>
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
        <div className="azzle-footer-bottom-text-wrap">
          <div className="azzle-footer-bottom-logo">
            <Link href="/">
              <img src="assets/images/logo/logo-white.svg" alt="Logo" />
            </Link>
          </div>
          <div className="azzle-footer-bottom-text2">
            <p>© Copyright {new Date().getFullYear()}, All Rights Reserved by favdevs</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
