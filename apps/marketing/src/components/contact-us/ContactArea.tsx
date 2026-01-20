

export default function ContactArea() {
  return (
    <div className="azzle-section-padding">
      <div className="container">
        <div className="row">
          <div className="col-lg-6">
            <div className="azzle-default-content pr70" data-aos="fade-up" data-aos-delay="700">
              <h2>Get in touch with us directly</h2>
              <p className="mb-0">We are here to help you! Tell us how we can help & we'll be in touch with an expert within the next 24 hours.</p>
              <div className="mt-50">
                <div className="azzle-contact-info-wrap">
                  <div className="azzle-contact-info-item">
                    <h5>Send us an email:</h5>
                    <a href="mailto:info@example.com">info@example.com</a>
                  </div>
                  <div className="azzle-contact-info-item">
                    <h5>Give us a call:</h5>
                    <a href="tel:123">(123) 456-7890</a>
                  </div>
                  <div className="azzle-contact-info-item">
                    <h5>Follow us:</h5>
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
          <div className="col-lg-6">
            <div className="azzle-contact-box" data-aos="fade-up" data-aos-delay="900">
              <form action="#">
                <div className="azzle-contact-column">
                  <div className="azzle-contact-field">
                    <label>Enter your name</label>
                    <input type="text" placeholder="Adam Smith" />
                  </div>
                  <div className="azzle-contact-field">
                    <label>Email address</label>
                    <input type="email" placeholder="example@gmail.com" />
                  </div>
                </div>
                <div className="azzle-contact-column">
                  <div className="azzle-contact-field">
                    <label>Phone number</label>
                    <input type="number" placeholder="(123) 456 - 7890" />
                  </div>
                  <div className="azzle-contact-field">
                    <label>Company</label>
                    <input type="text" placeholder="EX Facebook" />
                  </div>
                </div>
                <div className="azzle-contact-field">
                  <label>Message</label>
                  <textarea name="message" placeholder="Write your message here..."></textarea>
                </div>
                <button id="azzle-main-submit-btn" type="button">Send your message</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
