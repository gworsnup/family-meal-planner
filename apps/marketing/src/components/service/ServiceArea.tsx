import Link from "next/link";
import type { ReactNode } from "react";

type ServiceItem = {
  title: string;
  description: string;
  href: string;
};

type ServiceAreaProps = {
  content?: {
    title?: string;
    items?: Partial<ServiceItem>[];
  };
};

export default function ServiceArea({ content }: ServiceAreaProps) {
  const defaultItems: (ServiceItem & { icon: ReactNode })[] = [
    {
      title: "Resource Flexibility",
      description:
        "AI SaaS solutions designed be scalable, allowing users to adjust their needs.",
      href: "/single-service",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="70" height="70" viewBox="0 0 70 70" fill="none">
          <path fillRule="evenodd" clipRule="evenodd" d="M35 8.70058L23.3333 0V23.3333H0L8.70058 35L1.01993e-06 46.6665H23.3333V23.3333H36.6665V0L35 8.70058ZM61.2994 35L70 23.3334H36.6665V46.6665H23.3333V70L35 61.2994L46.6665 70V46.6665H70L61.2994 35Z" fill="black" />
        </svg>
      ),
    },
    {
      title: "Managed Services",
      description:
        "Providers typically hale the maintenance so patching of the infrastructure.",
      href: "/single-service",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="70" height="70" viewBox="0 0 70 70" fill="none">
          <path fillRule="evenodd" clipRule="evenodd" d="M0 55.4417C16.155 50.3359 19.6652 53.8457 14.5591 70C23.9937 53.8457 46.0065 53.8457 55.441 70C50.3384 53.8457 53.8489 50.3359 70 55.4417C53.8489 46.0075 53.8489 23.9961 70 14.5621C53.8489 19.6641 50.3384 16.1541 55.441 0C46.0065 16.1541 23.9937 16.1541 14.5591 0C19.6652 16.1541 16.155 19.6641 0 14.5621C16.155 23.9961 16.155 46.0075 0 55.4417ZM35 47.95C42.1522 47.95 47.95 42.1522 47.95 35C47.95 27.8479 42.1522 22.05 35 22.05C27.8479 22.05 22.05 27.8479 22.05 35C22.05 42.1522 27.8479 47.95 35 47.95Z" fill="black" />
        </svg>
      ),
    },
    {
      title: "Web-Based Access",
      description:
        "Web browsers or making easy to use anywhere with an internet connection.",
      href: "/single-service",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="70" height="70" viewBox="0 0 70 70" fill="none">
          <g clipPath="url(#clip0_1_4318)">
            <path d="M54.6224 50.3776L39.2444 35L54.6224 19.6223L70 35L54.6224 50.3776ZM15.3777 50.3776L0 35L15.3777 19.6223L30.7555 35L15.3777 50.3776ZM35 70L19.6223 54.6224L35 39.2444L50.3776 54.6224L35 70ZM35 30.7555L19.6223 15.3777L35 0L50.3776 15.3777L35 30.7555Z" fill="black" />
          </g>
          <defs>
            <clipPath id="clip0_1_4318">
              <rect width="70" height="70" fill="white" />
            </clipPath>
          </defs>
        </svg>
      ),
    },
    {
      title: "Friendly Interfaces",
      description:
        "user-friendly interfaces and dashboards, making it easier for non-technical users.",
      href: "/single-service",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="70" height="70" viewBox="0 0 70 70" fill="none">
          <path fillRule="evenodd" clipRule="evenodd" d="M20.5299 51.7242C20.0703 50.7306 19.2695 49.9298 18.2757 49.4699C10.5407 45.8923 4.42168 40.733 1.15547 37.639C-0.385161 36.1796 -0.385154 33.8204 1.15547 32.3609C4.42168 29.2668 10.5407 24.1076 18.2757 20.53C19.2695 20.0703 20.0703 19.2695 20.5299 18.2757C24.1076 10.5407 29.2668 4.42168 32.3609 1.15547C33.8204 -0.385159 36.1796 -0.385155 37.639 1.15547C40.733 4.42168 45.8923 10.5407 49.4699 18.2757C49.9298 19.2695 50.7306 20.0703 51.7242 20.5299C59.4594 24.1076 65.5784 29.2668 68.8445 32.3609C70.3852 33.8204 70.3852 36.1796 68.8445 37.639C65.5784 40.733 59.4594 45.8923 51.7242 49.4699C50.7306 49.9298 49.9298 50.7306 49.4699 51.7242C45.8923 59.4594 40.733 65.5784 37.639 68.8445C36.1796 70.3852 33.8204 70.3852 32.3609 68.8445C29.2668 65.5784 24.1076 59.4594 20.5299 51.7242ZM35.0001 47.8655C42.1053 47.8655 47.8655 42.1053 47.8655 35.0001C47.8655 27.8946 42.1053 22.1345 35.0001 22.1345C27.8946 22.1345 22.1346 27.8946 22.1346 35.0001C22.1346 42.1053 27.8946 47.8655 35.0001 47.8655Z" fill="black" />
        </svg>
      ),
    },
    {
      title: "Anomaly Detection",
      description:
        "AI SaaS can analyze IoT sensor data to detect predict equipment failures.",
      href: "/single-service",
      icon: (
        <svg width="70" height="68" viewBox="0 0 70 68" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M42.2059 3.11765H62.7941C63.3402 3.11765 63.8638 3.33457 64.2499 3.72067C64.636 4.10677 64.8529 4.63044 64.8529 5.17648V25.7647C64.8529 26.3107 64.636 26.8344 64.2499 27.2205C63.8638 27.6066 63.3402 27.8235 62.7941 27.8235H42.2059C41.6599 27.8235 41.1362 27.6066 40.7501 27.2205C40.364 26.8344 40.1471 26.3107 40.1471 25.7647V5.17648C40.1471 4.63044 40.364 4.10677 40.7501 3.72067C41.1362 3.33457 41.6599 3.11765 42.2059 3.11765ZM4.11765 43.2647H24.7059C25.2519 43.2647 25.7756 43.4816 26.1617 43.8677C26.5478 44.2538 26.7647 44.7775 26.7647 45.3235V65.9118C26.7647 66.4578 26.5478 66.9815 26.1617 67.3676C25.7756 67.7537 25.2519 67.9706 24.7059 67.9706H4.11765C3.57161 67.9706 3.04794 67.7537 2.66184 67.3676C2.27573 66.9815 2.05882 66.4578 2.05882 65.9118V45.3235C2.05882 44.7775 2.27573 44.2538 2.66184 43.8677C3.04794 43.4816 3.57161 43.2647 4.11765 43.2647ZM55.3082 40.1682L69.72 64.8741C70.5199 66.2474 69.5306 67.9706 67.9412 67.9706H39.1176C37.5282 67.9706 36.539 66.2474 37.3388 64.8741L51.7506 40.1682C52.5453 38.8063 54.5135 38.8063 55.3082 40.1682ZM15.4412 0.0294189C23.9688 0.0294189 30.8824 6.94295 30.8824 15.4706C30.8824 23.9982 23.9688 30.9118 15.4412 30.9118C6.91353 30.9118 0 23.9982 0 15.4706C0 6.94295 6.91353 0.0294189 15.4412 0.0294189Z" fill="black" />
        </svg>
      ),
    },
    {
      title: "Predictive Analytics",
      description:
        "Solutions that use AI to predict future trends and outcomes, such as demand forecastin.",
      href: "/single-service",
      icon: (
        <svg width="70" height="70" viewBox="0 0 70 70" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" clipRule="evenodd" d="M35.1355 32.1486C33.6845 14.1523 18.62 0 0.250001 0C0.250001 18.2848 14.2714 33.2948 32.1486 34.8645C14.1523 36.3153 8.02977e-07 51.38 0 69.7501C18.2848 69.7501 33.2948 55.7287 34.8645 37.8515C36.3153 55.8478 51.38 70 69.7501 70C69.7501 51.7153 55.7288 36.7052 37.8515 35.1354C55.8478 33.6846 70 18.62 70 0.25C51.7153 0.249999 36.7052 14.2714 35.1355 32.1486ZM34.9991 35.0007L35.0007 35.001L35.0011 34.9991C35.0004 34.9991 34.9991 34.9991 34.9991 34.9991V35.0007Z" fill="black" />
        </svg>
      ),
    },
    {
      title: "Speech Recognition",
      description:
        "Speech recognition services convert spoken language into text and accessibility.",
      href: "/single-service",
      icon: (
        <svg width="70" height="70" viewBox="0 0 70 70" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" clipRule="evenodd" d="M34.998 64.2989C37.3733 67.1496 39.7484 70 44.499 70C55.4344 70 58.5932 55.4554 58.5974 44.5046C58.5974 39.7544 61.4478 37.3793 64.2985 35.0042C67.1493 32.6289 70 30.2538 70 25.5036C70 14.5649 55.4344 11.4021 44.5028 11.4021C39.7527 11.4021 37.3772 8.55159 35.0021 5.70105C32.6268 2.85052 30.2515 0 25.5011 0C14.5617 0 11.3987 14.5649 11.3987 25.4956C11.3987 30.2458 8.54906 32.6209 5.69936 34.996C2.84969 37.3713 0 39.7463 0 44.4966C0 55.4351 14.5617 58.598 25.497 58.598C30.2475 58.598 32.6228 61.4484 34.998 64.2989ZM35 47.95C42.1522 47.95 47.95 42.1522 47.95 35C47.95 27.8479 42.1522 22.05 35 22.05C27.8479 22.05 22.05 27.8479 22.05 35C22.05 42.1522 27.8479 47.95 35 47.95Z" fill="black" />
        </svg>
      ),
    },
    {
      title: "Computer Vision",
      description:
        "Computer vision services use AI to interpret and process visual information.",
      href: "/single-service",
      icon: (
        <svg width="71" height="70" viewBox="0 0 71 70" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M42.28 0H27.776C25.312 0 23.352 1.96002 23.352 4.42402V18.928C23.352 21.392 25.312 23.352 27.776 23.352H42.28C44.744 23.352 46.704 21.392 46.704 18.928V4.42402C46.704 1.96002 44.688 0 42.28 0Z" fill="black" />
          <path d="M27.776 70H42.28C44.744 70 46.704 68.04 46.704 65.576V51.072C46.704 48.608 44.744 46.648 42.28 46.648H27.776C25.312 46.648 23.352 48.608 23.352 51.072V65.576C23.352 67.984 25.368 70 27.776 70Z" fill="black" />
          <path d="M46.7042 27.7201V42.2241C46.7042 44.6881 48.6642 46.6481 51.1282 46.6481H65.6322C68.0962 46.6481 70.0562 44.6881 70.0562 42.2241V27.7201C70.0562 25.2561 68.0962 23.2961 65.6322 23.2961H51.1282C48.6642 23.2961 46.7042 25.3121 46.7042 27.7201Z" fill="black" />
          <path d="M0 27.7201V42.2241C0 44.6881 1.96002 46.6481 4.42402 46.6481H18.9281C21.3921 46.6481 23.3521 44.6881 23.3521 42.2241V27.7201C23.3521 25.2561 21.3921 23.2961 18.9281 23.2961H4.42402C2.01602 23.2961 0 25.3121 0 27.7201Z" fill="black" />
        </svg>
      ),
    },
  ];
  const items = defaultItems.map((item, index) => ({
    ...item,
    ...content?.items?.[index],
  }));
  const title = content?.title ?? "We provide smart AI solutions for all tasks";

  return (
    <section className="azzle-section-padding">
      <div className="container">
        <div className="azzle-section-title center max-width-780" data-aos="fade-up" data-aos-delay="500">
          <h2>{title}</h2>
        </div>
        <div className="azzle-iconbox-wrapper" data-aos="fade-up" data-aos-delay="700">
          <div className="azzle-iconbox-column">
            {items.map((item) => (
              <div key={item.title} className="azzle-iconbox-wrap">
                <div className="azzle-iconbox-icon">{item.icon}</div>
                <div className="azzle-iconbox-content">
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
                <div className="azzle-iconbox-button mt-50">
                  <Link href={item.href}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="26" height="22" viewBox="0 0 26 22" fill="none">
                      <path d="M15.5 2.25L24.25 11M24.25 11L15.5 19.75M24.25 11L1.75 11" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
