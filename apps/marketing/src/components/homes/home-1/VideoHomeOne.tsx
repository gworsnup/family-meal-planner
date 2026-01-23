import ModalVideo from "@/modal/modalVideo";

type VideoHomeOneProps = {
  content?: {
    imageSrc?: string;
    imageAlt?: string;
    videoUrl?: string;
    title?: string;
    description?: string;
    stats?: { value: string; label: string }[];
  };
};

export default function VideoHomeOne({ content }: VideoHomeOneProps) {
  const imageSrc = content?.imageSrc ?? "assets/images/home1/thumb3.png";
  const imageAlt = content?.imageAlt ?? "Thumb";
  const videoUrl =
    content?.videoUrl ?? "https://www.youtube.com/watch?v=zE_WFiHnSlY";
  const title = content?.title ?? "AI-powered that streamline tasks";
  const description =
    content?.description ??
    "As your business grows or your AI SaaS needs change, you can easily adjust your subscription level to match those needs. This flexibility ensures that AI remains an asset.";
  const stats =
    content?.stats ?? [
      { value: "92%", label: "Customer service inquiries" },
      { value: "75%", label: "Using financial institutions" },
    ];

  return (
    <section className="azzle-video-section">
      <div className="row">
        <div className="col-xl-6">
          <div className="azzle-video-thumb">
            <img src={imageSrc} alt={imageAlt} />
            <ModalVideo>
              <a className="azzle-popup-video video-init" href={videoUrl}>
                <img src="assets/images/home1/play-btn.png" alt="" />
                <div className="waves wave-1"></div>
                <div className="waves wave-2"></div>
                <div className="waves wave-3"></div>
              </a>

            </ModalVideo>
          </div>
        </div>
        <div className="col-xl-6 d-flex align-items-center">
          <div className="azzle-video-wrap" data-aos="fade-up" data-aos-delay="500">
            <div className="azzle-video-content">
              <h2>{title}</h2>
              <p>{description}</p>
              <div className="divider2"></div>
              <div className="azzle-counter-wrap">
                {stats.map((stat) => (
                  <div key={stat.label} className="azzle-counter-item">
                    <h2 className="azzle-counter-data" aria-label={stat.value}>
                      {stat.value}
                    </h2>
                    <p>{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
