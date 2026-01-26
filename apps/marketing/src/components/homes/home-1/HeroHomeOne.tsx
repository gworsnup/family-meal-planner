"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import Slider from "react-slick";
import RecipeScrollSequence from "../../RecipeScrollSequence";

export interface HeroContent {
  headline?: string;
  subheadline?: string;
  primaryCta?: { label?: string; href?: string };
  secondaryCta?: { label?: string; href?: string };
  imageSrc?: string;
  imageAlt?: string;
  brandLine?: string;
}

type HeroHomeOneProps = {
  content?: HeroContent;
};

const SCROLL_VH = 220;

const settings = {
  slidesToShow: 4,
  slidesToScroll: 1,
  autoplay: true,
  autoplaySpeed: 0,
  speed: 5000,
  arrows: false,
  pauseOnHover: false,
  cssEase: "linear",
  responsive: [{
    breakpoint: 1199,
    settings: {
      slidesToShow: 3
    }
  }, {
    breakpoint: 767,
    settings: {
      slidesToShow: 1
    }
  }]
}

export default function HeroHomeOne({ content }: HeroHomeOneProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const headline = content?.headline ?? "Simplify your SaaS solution with AI";
  const subheadline =
    content?.subheadline ??
    "Our AI SAAS tool is a cloud-based software delivery model. It helps businesses forecast demand for products and services and optimize inventory management and supply chain operations.";
  const primaryCtaLabel = content?.primaryCta?.label ?? "Get started for free";
  const primaryCtaHref = content?.primaryCta?.href ?? "/contact-us";
  const secondaryCtaLabel = content?.secondaryCta?.label ?? "Learn more";
  const secondaryCtaHref = content?.secondaryCta?.href ?? "/contact-us";
  const heroImageSrc = content?.imageSrc ?? "assets/images/home1/Dashboard.png";
  const heroImageAlt = content?.imageAlt ?? "Dashboard";
  const brandLine =
    content?.brandLine ??
    "Companies of all sizes trust us to find AI SaaS critical to their growth and innovation";

  const { scrollYProgress } = useScroll({
    target: wrapperRef,
    offset: ["start start", "end end"],
  });
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
  });
  const contentOpacity = useTransform(smoothProgress, [0.78, 0.9], [0, 1]);
  const contentY = useTransform(smoothProgress, [0.78, 0.9], [24, 0]);
  const contentPointerEvents = useTransform(smoothProgress, (value) =>
    value > 0.88 ? "auto" : "none",
  );

  useEffect(() => {
    return scrollYProgress.on("change", (value) => {
      progressRef.current = value;
    });
  }, [scrollYProgress]);

  return (
    <>
      <section className="azzle-hero-section" style={{ position: "relative" }}>
        <div ref={wrapperRef} style={{ height: `${SCROLL_VH}vh` }}>
          <div className="sticky top-0 h-screen w-full overflow-hidden relative bg-white isolate">
            <RecipeScrollSequence
              progressRef={progressRef}
              className="absolute inset-0 h-full w-full"
            />
            <motion.div
              style={{
                opacity: contentOpacity,
                y: contentY,
                pointerEvents: contentPointerEvents,
              }}
              className="relative z-10"
            >
              <div className="azzle-hero-shape">
                <img src="assets/images/home1/hero-bg.png" alt="bg" />
              </div>
              <div
                className="container"
                style={{ position: "relative", zIndex: 10 }}
              >
                <div className="azzle-hero-content1">
                  <h1 data-aos="fade-left" data-aos-delay="500">
                    {headline}
                  </h1>
                  <p data-aos="zoom-in" data-aos-delay="700">
                    {subheadline}
                  </p>
                  <div className="azzle-hero-button mt-50">
                    <Link
                      className="azzle-default-btn"
                      data-aos="fade-up"
                      data-aos-delay="900"
                      href={primaryCtaHref}
                      data-text={primaryCtaLabel}
                    >
                      <span className="button-wraper">{primaryCtaLabel}</span>
                    </Link>
                    <Link
                      className="azzle-default-btn outline-btn"
                      data-aos="fade-up"
                      data-aos-delay="1000"
                      href={secondaryCtaHref}
                      data-text={secondaryCtaLabel}
                    >
                      <span className="button-wraper">
                        {secondaryCtaLabel}
                      </span>
                    </Link>
                  </div>
                </div>
                <div
                  className="azzle-hero-dashboard"
                  data-aos="fade-up"
                  data-aos-delay=".7s"
                >
                  <img src={heroImageSrc} alt={heroImageAlt} />
                </div>
                <div className="divider"></div>
                <div className="azzle-brand-slider-wraper">
                  <div
                    className="azzle-brand-slider-title"
                    data-aos="fade-up"
                    data-aos-delay=".9s"
                  >
                    <p>{brandLine}</p>
                  </div>
                  <Slider {...settings} className="azzle-brand-slider">
                    <div className="azzle-logo-icon-item">
                      <img src="assets/images/home1/icon1.svg" alt="Icon" />
                    </div>
                    <div className="azzle-logo-icon-item">
                      <img src="assets/images/home1/icon2.svg" alt="Icon" />
                    </div>
                    <div className="azzle-logo-icon-item">
                      <img src="assets/images/home1/icon3.svg" alt="Icon" />
                    </div>
                    <div className="azzle-logo-icon-item">
                      <img src="assets/images/home1/icon4.svg" alt="Icon" />
                    </div>
                    <div className="azzle-logo-icon-item">
                      <img src="assets/images/home1/icon5.svg" alt="Icon" />
                    </div>
                  </Slider>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}
