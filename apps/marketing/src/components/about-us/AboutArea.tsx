
type AboutAreaProps = {
  content?: {
    title?: string;
    imageSrc?: string;
    imageAlt?: string;
  };
};

export default function AboutArea({ content }: AboutAreaProps) {
  const title = content?.title ?? "We are a trusted partner in our clients' AI journey";
  const imageSrc = content?.imageSrc ?? "assets/images/about/about-hero-image.jpg";
  const imageAlt = content?.imageAlt ?? "";

  return (
    <section className="azzle-section-padding">
      <div className="container">
        <div className="azzle-section-title center max-width-850" data-aos="fade-up" data-aos-delay="500">
          <h2>{title}</h2>
        </div>
        <div className="azzle-single-thumb" data-aos="fade-up" data-aos-delay="700">
          <img src={imageSrc} alt={imageAlt} />
        </div>
      </div>
    </section>
  )
}
