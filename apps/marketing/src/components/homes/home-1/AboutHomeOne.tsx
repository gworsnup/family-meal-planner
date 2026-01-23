
type AboutHomeOneProps = {
  content?: {
    sections?: {
      imageSrc?: string;
      imageAlt?: string;
      title?: string;
      paragraphs?: string[];
      listItems?: string[];
    }[];
  };
};

export default function AboutHomeOne({ content }: AboutHomeOneProps) {
  const defaultSections = [
    {
      imageSrc: "assets/images/home1/thumb2.png",
      imageAlt: "Thumb",
      title: "Accessible to a wider audience",
      paragraphs: [
        "Advanced AI capabilities accessible to a broader audience, including small & medium-sized businesses and individuals who may not have the resources or expertise to develop.",
        "AI platform are typically accessible via the internet, making services available anywhere with an internet connection.",
      ],
      listItems: [],
    },
    {
      imageSrc: "assets/images/home1/thumb1.png",
      imageAlt: "Thumb",
      title: "Providing quick deploy solutions",
      paragraphs: [
        "Our AI SaaS solutions can be quickly deployed, enabling users to start benefiting from AI capabilities without lengthy setup and development times in fast-paced industries.",
      ],
      listItems: [
        "Ready-to-use AI capabilities system",
        "Users can quickly integrate AI features",
        "Time savings translate to cost savings",
      ],
    },
  ];
  const sections = defaultSections.map((section, index) => ({
    ...section,
    ...content?.sections?.[index],
  }));
  const firstSection = sections[0];
  const secondSection = sections[1];

  return (
    <>
      <div className="azzle-section-padding pt-0 overflow-hidden">
        <div className="container">
          <div className="row">
            <div className="col-lg-5">
              <div className="azzle-content-thumb" data-aos="fade-right" data-aos-delay="500">
                <img src={firstSection.imageSrc} alt={firstSection.imageAlt} />
              </div>
            </div>
            <div className="col-lg-7 d-flex align-items-center">
              <div className="azzle-default-content pl-110" data-aos="fade-left" data-aos-delay="700">
                <h2>{firstSection.title}</h2>
                {firstSection.paragraphs?.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="azzle-section-padding pt-0 overflow-hidden">
        <div className="container">
          <div className="row">
            <div className="col-lg-5 order-lg-2">
              <div className="azzle-content-thumb" data-aos="zoom-in" data-aos-delay="500">
                <img src={secondSection.imageSrc} alt={secondSection.imageAlt} />
              </div>
            </div>
            <div className="col-lg-7 d-flex align-items-center">
              <div className="azzle-default-content pr-110" data-aos="fade-up" data-aos-delay="700">
                <h2>{secondSection.title}</h2>
                {secondSection.paragraphs?.map((paragraph, index) => (
                  <p key={paragraph} className={index === 0 ? "mb-0" : undefined}>
                    {paragraph}
                  </p>
                ))}
                {secondSection.listItems?.length ? (
                  <div className="azzle-listicon-wrap mt-50">
                    <ul>
                      {secondSection.listItems.map((item) => (
                        <li key={item}>
                          <img src="assets/images/home1/arrow.svg" alt="Icon" />
                          <h3>{item}</h3>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
