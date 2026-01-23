
type TestimonialHomeOneProps = {
  content?: {
    title?: string;
    items?: {
      quote?: string;
      name?: string;
      role?: string;
      imageSrc?: string;
      imageAlt?: string;
    }[];
  };
};

export default function TestimonialHomeOne({
  content,
}: TestimonialHomeOneProps) {
  const defaultItems = [
    {
      quote:
        "“This AI SaaS tool has revolutionized the way we process and analyze data. This is a game-changer for our business.”",
      name: "Max Weber",
      role: "Web Developer",
      imageSrc: "assets/images/home1/author1.png",
      imageAlt: "thumb",
    },
    {
      quote:
        "\"It answers immediately, and we've seen a significant reduction in response time. Our customers love it and so do we!\"",
      name: "Douglas Smith",
      role: "Businessman",
      imageSrc: "assets/images/home1/author2.png",
      imageAlt: "thumb",
    },
    {
      quote:
        "\"It is accurate, fast and supports multiple languages support. It is a must for any international business success.\"",
      name: "Abraham Maslo",
      role: "Founder @ Marketing Company",
      imageSrc: "assets/images/home1/author3.png",
      imageAlt: "thumb",
    },
    {
      quote:
        "\"Security is a top concern for us, and AI SaaS takes it seriously. It's a reassuring layer of protection for our organization.\"",
      name: "Jack Fayol",
      role: "HR Manager",
      imageSrc: "assets/images/home1/author4.png",
      imageAlt: "thumb",
    },
    {
      quote:
        "\"We were concerned about integrating their APIs were well documented, and their support team was super cool.\"",
      name: "Karen Lynn",
      role: "Software Engineer",
      imageSrc: "assets/images/home1/author5.png",
      imageAlt: "thumb",
    },
    {
      quote:
        "\"The return on investment has exceeded our expectations. it's an investment in the future of our business.\"",
      name: "Henry Ochi",
      role: "Bank Manager",
      imageSrc: "assets/images/home1/author6.png",
      imageAlt: "thumb",
    },
  ];
  const items = defaultItems.map((item, index) => ({
    ...item,
    ...content?.items?.[index],
  }));
  const title = content?.title ?? "Positive feedback from our users";

  return (
    <div className="azzle-section-padding3 bg-heading">
      <div className="container">
        <div className="azzle-section-title title2 center" data-aos="fade-up" data-aos-delay="500">
          <h2>{title}</h2>
        </div>
        <div className="row">
          {items.map((item, index) => (
            <div key={`${item.name}-${index}`} className="col-xl-4 col-lg-6 col-md-6">
              <div
                className="azzle-iconbox-wrap2"
                data-aos="fade-up"
                data-aos-delay={200 + (index % 3) * 200}
              >
                <div className="azzle-iconbox-rating">
                  <img src="assets/images/home1/start.svg" alt="ratting" />
                </div>
                <div className="azzle-iconbox-content2">
                  <p>{item.quote}</p>
                </div>
                <div className="azzle-iconbox-author-wrap">
                  <div className="azzle-iconbox-author-thumb">
                    <img src={item.imageSrc} alt={item.imageAlt} />
                  </div>
                  <div className="azzle-iconbox-author-data">
                    <p>{item.name}</p>
                    <span>{item.role}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
