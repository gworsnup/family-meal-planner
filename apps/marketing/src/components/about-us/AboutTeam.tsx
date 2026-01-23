import Link from "next/link";

type TeamMember = {
  name: string;
  role: string;
  imageSrc: string;
};

type AboutTeamProps = {
  content?: {
    title?: string;
    cta?: { label?: string; href?: string };
    members?: Partial<TeamMember>[];
    socialLinks?: Partial<{ href: string; iconSrc: string }>[];
  };
};

export default function AboutTeam({ content }: AboutTeamProps) {
  const defaultMembers: TeamMember[] = [
    { name: "Mr. Abraham Maslo", role: "Chief AI Officer", imageSrc: "assets/images/team/team1.png" },
    { name: "Willium Robert", role: "Data Engineer", imageSrc: "assets/images/team/team2.png" },
    { name: "Henry Fayol", role: "Research Scientist", imageSrc: "assets/images/team/team3.png" },
    { name: "Henry Martine", role: "AI Researchers", imageSrc: "assets/images/team/team4.png" },
    { name: "Jack Fox", role: "NLP Expert", imageSrc: "assets/images/team/team5.png" },
    { name: "Adam Smith", role: "Project Manager", imageSrc: "assets/images/team/team6.png" },
  ];
  const members = defaultMembers.map((member, index) => ({
    ...member,
    ...content?.members?.[index],
  }));
  const title = content?.title ?? "Our team consists of a group of talents";
  const ctaLabel = content?.cta?.label ?? "Join our team";
  const ctaHref = content?.cta?.href ?? "/team";
  const defaultSocialLinks = [
    { href: "https://www.facebook.com", iconSrc: "assets/images/home2/facebook.svg" },
    { href: "https://www.twitter.com", iconSrc: "assets/images/home2/twitter.svg" },
    { href: "https://www.instagram.com", iconSrc: "assets/images/home2/insta.svg" },
    { href: "https://www.linkedin.com", iconSrc: "assets/images/home2/in.svg" },
  ];
  const socialLinks = defaultSocialLinks.map((link, index) => ({
    ...link,
    ...content?.socialLinks?.[index],
  }));

  return (
    <section className="azzle-section-padding2">
      <div className="container">
        <div className="azzle-section-title two-column" data-aos="fade-right" data-aos-delay="500">
          <div className="row">
            <div className="col-lg-7">
              <h2>{title}</h2>
            </div>
            <div className="col-lg-5 d-flex align-items-center">
              <div className="section-title-button">
                <Link
                  className="azzle-default-btn"
                  data-aos="fade-right"
                  data-aos-delay="900"
                  href={ctaHref}
                  data-text={ctaLabel}
                >
                  <span className="button-wraper">{ctaLabel}</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div className="row">
          {members.map((member, index) => (
            <div key={member.name} className="col-xl-4 col-lg-6 col-md-6">
              <div
                className="azzle-team-wrap wrap2"
                data-aos="fade-up"
                data-aos-delay={500 + (index % 3) * 200}
              >
                <Link href="/single-team">
                  <div className="azzle-team-thumb">
                    <img src={member.imageSrc} alt="Thumb" />
                  </div>
                  <div className="azzle-team-content">
                    <h3>{member.name}</h3>
                  </div>
                </Link>

                <div className="azzle-team-author-wrap">
                  <div className="azzle-team-author-data">
                    <p>{member.role}</p>
                  </div>
                  <div className="azzle-social-wrap2 social-hover-orange">
                    <ul>
                      {socialLinks.map((link) => (
                        <li key={`${member.name}-${link.href}`}>
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
          ))}
        </div>
      </div>
    </section>
  )
}
