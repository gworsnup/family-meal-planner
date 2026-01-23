"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { footerContent } from "@/content/footer";

// ✅ CTA slider items (data-driven)
const fallbackCtaItems = [
  "Start building software",
  "Boost your productivity",
  "Grow your business",
  "Innovate with AI",
  "Deliver faster",
  "Stay ahead of trends",
];

const fallbackColumns = [
  {
    title: "Primary Pages",
    links: [
      { label: "Home", href: "/" },
      { label: "About Us", href: "/about-us" },
      { label: "Services", href: "/service" },
      { label: "Pricing", href: "/pricing" },
      { label: "Contact", href: "/contact-us" },
    ],
  },
  {
    title: "Utility Pages",
    links: [
      { label: "Faq", href: "/faq" },
      { label: "Sign Up", href: "/sign-up" },
      { label: "Sign In", href: "/sign-in" },
      { label: "Reset Password", href: "/reset-password" },
      { label: "404 Not found", href: "/errors-404" },
    ],
  },
];

export default function FooterOne() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const ctaItems = footerContent.cta?.items ?? fallbackCtaItems;
  const primaryColumn = footerContent.columns?.[0] ?? fallbackColumns[0];
  const utilityColumn = footerContent.columns?.[1] ?? fallbackColumns[1];
  const copyrightText = (footerContent.copyrightText ?? "© Copyright {year}, All Rights Reserved by favdevs").replace(
    "{year}",
    `${new Date().getFullYear()}`,
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clone content for infinite scroll effect
    const clone = container.innerHTML;
    container.innerHTML += clone;

    let scrollAmount = 0;
    let frameId: number;

    const marqueeScroll = () => {
      if (!isPaused && container) {
        scrollAmount += 2; // speed
        container.style.transform = `translateX(-${scrollAmount}px)`;

        if (scrollAmount >= container.scrollWidth / 2) {
          scrollAmount = 0;
        }
      }
      frameId = requestAnimationFrame(marqueeScroll);
    };

    frameId = requestAnimationFrame(marqueeScroll);
    return () => cancelAnimationFrame(frameId);
  }, [isPaused]);

  return (
    <footer className="azzle-footer-section">
      {/* Shape */}
      <div className="azzle-footer-shape">
        <img
          src={footerContent.shape?.src ?? "assets/images/home1/footer-shape.png"}
          alt={footerContent.shape?.alt ?? "shape"}
        />
      </div>

      {/* CTA Slider */}
      <div
        className="azzle-footer-top inner-mwrquee-wra overflow-hidden"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div
          className="azzle-cta-slider-init flex"
          ref={containerRef}
          style={{
            display: "inline-flex",
            whiteSpace: "nowrap",
            willChange: "transform",
          }}
        >
          {ctaItems.map((title, i) => (
            <div key={i} className="azzle-cta-slider-item flex items-center px-6">
              <img
                src={footerContent.cta?.icon?.src ?? "assets/images/home1/star.svg"}
                alt={footerContent.cta?.icon?.alt ?? "Icon"}
              />
              <div className="azzle-cta-slider-title">{title}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer content */}
      <div className="container">
        <div className="azzle-footer-one">
          <div className="row">
            
            <div className="col-xl-4 col-lg-12 col-md-12">
              <div className="azzle-footer-textarea">
                <Link href={footerContent.logo?.href ?? "/"}>
                  <img
                    src={footerContent.logo?.src ?? "assets/images/logo/logo-dark.svg"}
                    alt={footerContent.logo?.alt ?? "Logo"}
                  />
                </Link>
                <p>
                  {footerContent.description ??
                    "Our mission is to harness the power of AI to solve complex business challenges, empower decision-makers with data-driven insights, and enhance user experiences across digital platforms."}
                </p>
                <a href={footerContent.contact?.href ?? "mailto:example@gmail.com"}>
                  <span>{footerContent.contact?.label ?? "Website:"}</span>{" "}
                  {footerContent.contact?.text ?? "www.example@gmail.com"}
                </a>
              </div>
            </div>

            <div className="col-xl-2 col-lg-4 col-md-4">
              <div className="azzle-footer-menu pl-30">
                <h4>{primaryColumn.title}</h4>
                <ul>
                  {primaryColumn.links.map((link) => (
                    <li key={`${link.href}-${link.label}`}>
                      <Link href={link.href}>{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="col-xl-3 col-lg-4 col-md-4">
              <div className="azzle-footer-menu pl-70">
                <h4>{utilityColumn.title}</h4>
                <ul>
                  {utilityColumn.links.map((link) => (
                    <li key={`${link.href}-${link.label}`}>
                      <Link href={link.href}>{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="col-xl-3 col-lg-4 col-md-4">
              <div className="azzle-footer-menu mb-0">
                <h4>{footerContent.newsletter?.title ?? "Subscribe our newsletter"}</h4>
                <div className="azzle-subscribe-field">
                  <input
                    type="email"
                    placeholder={footerContent.newsletter?.placeholder ?? "Enter your email"}
                  />
                  <button className="sub-btn" type="submit">
                    <img
                      src={footerContent.newsletter?.buttonIcon?.src ?? "assets/images/home1/arrow-white.svg"}
                      alt={footerContent.newsletter?.buttonIcon?.alt ?? "Icon"}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="azzle-footer-bottom-text">
          <p>{copyrightText}</p>
        </div>
      </div>
    </footer>
  );
}
