type OurWorkAreaProps = {
  content?: {
    title?: string;
    items?: {
      title?: string;
      description?: string;
      iconSrc?: string;
    }[];
  };
};

export default function OurWorkArea({ content }: OurWorkAreaProps) {
  const defaultItems = [
    {
      title: "Innovation",
      description: "We’re committed to exploring new technologies, and finding",
      iconSrc: "assets/images/about/icon1.png",
    },
    {
      title: "Excellence",
      description: "We set high standards for our work & we are dedicated team",
      iconSrc: "assets/images/about/icon2.png",
    },
    {
      title: "Collaboration",
      description: "We believe in the power of collaboration, working closely",
      iconSrc: "assets/images/about/icon3.png",
    },
    {
      title: "Integrity",
      description: "We uphold the highest ethical honesty in all our interactions",
      iconSrc: "assets/images/about/icon4.png",
    },
  ];
  const items = defaultItems.map((item, index) => ({
    ...item,
    ...content?.items?.[index],
  }));
  const title = content?.title ?? "The core values behind our work";

  return (
      <div className="azzle-core-value-section azzle-section-padding">
        <div className="container">
          <div className="azzle-section-title title2 center max-w-650" data-aos="fade-up" data-aos-delay="500">
            <h2>{title}</h2>
          </div>
          <div className="azzle-core-value-column">
            {items.map((item, index) => (
              <div
                key={item.title}
                className="azzle-core-value-item"
                data-aos="fade-up"
                data-aos-delay={500 + index * 200}
              >
                <div className="azzle-core-value-header">
                  <div className="azzle-core-value-icon">
                    <img src={item.iconSrc} alt="" />
                  </div>
                  <h3>{item.title}</h3>
                </div>
                <p>{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
  )
}
