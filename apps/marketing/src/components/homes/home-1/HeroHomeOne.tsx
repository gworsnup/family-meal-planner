"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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
  const containerRef = useRef<HTMLDivElement>(null);
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

  // Use a longer scroll distance to allow time for the animation (e.g. 300vh)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
  });

  // Map scroll progress to animation phases
  // 0.0 - 0.7: Play video animation (controlled by RecipeScrollSequence via progressRef)
  // 0.7 - 0.9: Fade in hero content
  const contentOpacity = useTransform(smoothProgress, [0.75, 0.9], [0, 1]);
  const contentY = useTransform(smoothProgress, [0.75, 0.9], [40, 0]);
  const contentPointerEvents = useTransform(smoothProgress, (value) =>
    value > 0.85 ? "auto" : "none"
  );

  // Sync the raw or smooth progress to the ref for the canvas renderer
  useEffect(() => {
    return smoothProgress.on("change", (value) => {
      // Map global container progress (0..1) to animation progress (0..1)
      // We want the animation to finish a bit before the end so the content can fade in
      // Let's say animation runs from 0.0 to 0.8
      const animationEnd = 0.8; 
      const animationProgress = Math.min(1, Math.max(0, value / animationEnd));
      
      progressRef.current = animationProgress;
    });
  }, [smoothProgress]);

  return (
    <section className="azzle-hero-section relative z-10" data-aos="none">
      {/* 
        This generic container defines the total scroll height. 
        300vh = 3 screens worth of scrolling.
      */}
      <div 
        ref={containerRef} 
        style={{ height: "300vh" }} 
        className="relative w-full"
      >
        {/* 
          Sticky container: Sticks to the top while we scroll through the parent.
          Contains the canvas and the overlay content.
        */}
        <div className="sticky top-0 left-0 w-full h-screen overflow-hidden bg-white">
          
          {/* Background Animation Canvas */}
          <RecipeScrollSequence
            progressRef={progressRef}
            className="absolute inset-0 h-full w-full object-cover"
          />

          {/* Foreground Content */}
          <motion.div
            style={{
              opacity: contentOpacity,
              y: contentY,
              pointerEvents: contentPointerEvents,
            }}
            className="relative z-10 h-full flex flex-col justify-center"
          >
            {/* Shapes / Backgrounds Layered on top if needed */}
            <div className="azzle-hero-shape absolute top-0 left-0 w-full h-full pointer-events-none">
              <img src="assets/images/home1/hero-bg.png" alt="bg" className="w-full h-full object-cover opacity-50" />
            </div>

            <div className="container relative z-10 pt-20">
              <div className="azzle-hero-content1 text-center max-w-4xl mx-auto">
                <h1>{headline}</h1>
                <p>{subheadline}</p>
                <div className="azzle-hero-button mt-8 flex justify-center gap-4">
                  <Link
                    className="azzle-default-btn"
                    href={primaryCtaHref}
                    data-text={primaryCtaLabel}
                  >
                    <span className="button-wraper">{primaryCtaLabel}</span>
                  </Link>
                  <Link
                    className="azzle-default-btn outline-btn"
                    href={secondaryCtaHref}
                    data-text={secondaryCtaLabel}
                  >
                    <span className="button-wraper">
                      {secondaryCtaLabel}
                    </span>
                  </Link>
                </div>
              </div>

              {/* Dashboard Image & Brands - simplified layout for sticky mode */}
              <div className="azzle-hero-dashboard mt-12 px-4">
                 <img src={heroImageSrc} alt={heroImageAlt} className="mx-auto shadow-2xl rounded-lg" />
              </div>
              
              <div className="azzle-brand-slider-wraper mt-12 pb-12">
                  <div className="azzle-brand-slider-title text-center mb-6">
                    <p>{brandLine}</p>
                  </div>
                  <Slider {...settings} className="azzle-brand-slider">
                    <div className="azzle-logo-icon-item mx-4"><img src="assets/images/home1/icon1.svg" alt="Icon" /></div>
                    <div className="azzle-logo-icon-item mx-4"><img src="assets/images/home1/icon2.svg" alt="Icon" /></div>
                    <div className="azzle-logo-icon-item mx-4"><img src="assets/images/home1/icon3.svg" alt="Icon" /></div>
                    <div className="azzle-logo-icon-item mx-4"><img src="assets/images/home1/icon4.svg" alt="Icon" /></div>
                    <div className="azzle-logo-icon-item mx-4"><img src="assets/images/home1/icon5.svg" alt="Icon" /></div>
                  </Slider>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
