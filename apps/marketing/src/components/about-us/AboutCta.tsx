type AboutCtaProps = {
  content?: {
    imageSrc?: string;
    imageAlt?: string;
    title?: string;
    description?: string;
    contacts?: { label: string; value: string; href?: string }[];
  };
};

export default function AboutCta({ content }: AboutCtaProps) {
  const imageSrc = content?.imageSrc ?? "assets/images/about/image-3.png";
  const imageAlt = content?.imageAlt ?? "Thumb";
  const title = content?.title ?? "We always want to connect our clients";
  const description =
    content?.description ??
    "AI accessible and beneficial for organizations, and we look forward to partnering with businesses to achieve their AI goals.";
  const contacts =
    content?.contacts ?? [
      { label: "Website", value: "www.example.com", href: "" },
      { label: "Email", value: "info@example.com", href: "" },
      { label: "Phone", value: "(123) 456-7890", href: "" },
    ];

  return (
    <div className="azzle-content-section overflow-hidden">
      <div className="container">
        <div className="row gx-5">
          <div className="col-lg-5">
            <div className="azzle-content-thumb" data-aos="fade-right" data-aos-delay="500">
              <img src={imageSrc} alt={imageAlt} />
            </div>
          </div>
          <div className="col-lg-7 d-flex align-items-center">
            <div className="azzle-default-content w-100 light-color pl-30" data-aos="fade-up" data-aos-delay="700">
              <h2>{title}</h2>
              <p>{description}</p>

              <div className="mt-50">
                <div className="azzle-contact-info">
                  <ul>
                    {contacts.map((item) => (
                      <li key={item.label}>
                        {item.label}:<a href={item.href ?? ""}>{item.value}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
