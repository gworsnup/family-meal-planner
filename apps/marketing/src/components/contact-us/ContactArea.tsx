
type ContactAreaProps = {
  content?: {
    title?: string;
    description?: string;
    email?: string;
    phone?: string;
    socialLinks?: { href: string; iconSrc: string }[];
  };
};

export default function ContactArea({ content }: ContactAreaProps) {
  const title = content?.title ?? "Get in touch with us directly";
  const description =
    content?.description ??
    "We are here to help you! Tell us how we can help & we'll be in touch with an expert within the next 24 hours.";
  const email = content?.email ?? "info@example.com";
  const phone = content?.phone ?? "(123) 456-7890";
  const phoneHref = `tel:${phone.replace(/[^0-9+]/g, "")}`;
  const socialLinks =
    content?.socialLinks ?? [
      { href: "https://www.facebook.com", iconSrc: "assets/images/home2/facebook.svg" },
      { href: "https://www.twitter.com", iconSrc: "assets/images/home2/twitter.svg" },
      { href: "https://www.instagram.com", iconSrc: "assets/images/home2/insta.svg" },
      { href: "https://www.linkedin.com", iconSrc: "assets/images/home2/in.svg" },
    ];

  return (
    <div className="azzle-section-padding">
      <div className="container">
        <div className="row">
          <div className="col-lg-6">
            <div className="azzle-default-content pr70" data-aos="fade-up" data-aos-delay="700">
              <h2>{title}</h2>
              <p className="mb-0">{description}</p>
              <div className="mt-50">
                <div className="azzle-contact-info-wrap">
                  <div className="azzle-contact-info-item">
                    <h5>Send us an email:</h5>
                    <a href={`mailto:${email}`}>{email}</a>
                  </div>
                  <div className="azzle-contact-info-item">
                    <h5>Give us a call:</h5>
                    <a href={phoneHref}>{phone}</a>
                  </div>
                  <div className="azzle-contact-info-item">
                    <h5>Follow us:</h5>
                    <div className="azzle-social-wrap2 social-hover-orange">
                      <ul>
                        {socialLinks.map((link) => (
                          <li key={link.href}>
                            <a href={link.href}>
                              <img src={link.iconSrc} alt="Icon" />
                            </a>
                          </li>
                        ))}
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
