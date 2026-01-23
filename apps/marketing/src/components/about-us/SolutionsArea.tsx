import Link from "next/link";

type SolutionsAreaProps = {
  content?: {
    imageSrc?: string;
    imageAlt?: string;
    title?: string;
    paragraphs?: string[];
    cta?: { label?: string; href?: string };
  };
};

export default function SolutionsArea({ content }: SolutionsAreaProps) {
  const imageSrc = content?.imageSrc ?? "assets/images/about/about-image.png";
  const imageAlt = content?.imageAlt ?? "Thumb";
  const title = content?.title ?? "Delivering the best solutions with AI";
  const paragraphs = content?.paragraphs ?? [
    "Our mission is to empower businesses with AI-powered solutions that increase productivity, improve decision-making and drive growth.",
    "Since 2016 we have been passionate about helping our clients harness With a team of AI experts and data scientists their full potential & stay competitive in an increasingly digital world.",
  ];
  const ctaLabel = content?.cta?.label ?? "Get in touch";
  const ctaHref = content?.cta?.href ?? "/contact-us";

  return (
    <div className="azzle-section-padding">
      <div className="container">
        <div className="row">
          <div className="col-lg-5 order-lg-2">
            <div className="azzle-content-thumb" data-aos="zoom-in" data-aos-delay="500">
              <img src={imageSrc} alt={imageAlt} />
            </div>
          </div>
          <div className="col-lg-7 d-flex align-items-center">
            <div className="azzle-default-content pr50" data-aos="fade-up" data-aos-delay="700">
              <h2>{title}</h2>
              {paragraphs.map((paragraph, index) => (
                <p key={paragraph} className={index === paragraphs.length - 1 ? "mb-0" : undefined}>
                  {paragraph}
                </p>
              ))}
              <div className="mt-50">
                <Link
                  className="azzle-default-btn aos-init aos-animate"
                  data-aos="fade-up"
                  data-aos-delay="700"
                  href={ctaHref}
                  data-text={ctaLabel}
                >
                  <span className="button-wraper">{ctaLabel}</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
