 
"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ScrollSmoother from "gsap/ScrollSmoother";
import SplitText from "gsap/SplitText";
import AOS from "aos";
import "aos/dist/aos.css";

gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText);

export default function AnimationProvider() {
  // ✅ Initialize AOS first (simple scroll animations)
  useEffect(() => {
    AOS.init({
      duration: 800,
      once: true,
      easing: "ease-in-out",
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let smoother: ScrollSmoother; 
    let ctx: gsap.Context;

    const initGSAP = () => {
      ctx = gsap.context(() => {
        // ✅ Kill any existing smoother safely
        ScrollSmoother.get()?.kill();

        // ✅ Initialize ScrollSmoother
        smoother = ScrollSmoother.create({
          smooth: 1.2,
          effects: true,
          smoothTouch: false,
          normalizeScroll: false,
          ignoreMobileResize: true,
        });       
      });
    };

    // ✅ Run GSAP after AOS finishes DOM updates
    requestAnimationFrame(() => {
      setTimeout(initGSAP, 300);
    });

    // ✅ Refresh ScrollTrigger on window resize
    const handleResize = () => {
      ScrollTrigger.refresh();
    };

    window.addEventListener("resize", handleResize);

    // ✅ Cleanup
    return () => {
      if (ctx) ctx.revert();
      if (smoother) smoother.kill();
      window.removeEventListener("resize", handleResize);
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, []);

  return null;
}
