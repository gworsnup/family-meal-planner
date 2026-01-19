"use client";

import UseSticky from "../hooks/UseSticky";
import React, { useState, useEffect } from "react";

 

const ScrollToTop = () => {
  const { sticky }: { sticky: boolean } = UseSticky();
  const [showScroll, setShowScroll] = useState(false);
  const [scrollPercent, setScrollPercent] = useState(0);

  // Show / hide button
  const checkScrollTop = () => {
    const scrollPos = window.scrollY;
    const docHeight =
      document.documentElement.scrollHeight -
      document.documentElement.clientHeight;

    const scrolled = (scrollPos / docHeight) * 100;
    setScrollPercent(scrolled);

    if (!showScroll && scrollPos > 400) {
      setShowScroll(true);
    } else if (showScroll && scrollPos <= 400) {
      setShowScroll(false);
    }
  };

  const scrollTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    window.addEventListener("scroll", checkScrollTop);
    return () => window.removeEventListener("scroll", checkScrollTop);
  }, [showScroll]);

  return (
    <div
      className={`paginacontainer `}
      onClick={scrollTop}
    >
      <div className={`progress-wrap ${sticky && "active-progress"} ${showScroll ? "active-progress" : ""}`}>
        <svg
          className="progress-circle svg-content"
          width="100%"
          height="100%"
          viewBox="-1 -1 102 102"
        >
          <path
            d="M50,1 a49,49 0 0,1 0,98 a49,49 0 0,1 0,-98"
            strokeDasharray="307" // circle length ~ 2πr with r≈49
            strokeDashoffset={307 - (307 * scrollPercent) / 100}
          />
        </svg>
        <div className="top-arrow">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="25"
            height="20"
            viewBox="0 0 25 20"
            fill="none"
          >
            <path
              d="M14.4847 1C14.4847 1 14.875 5.5 18.9847 7.9C20.8665 8.99899 23.4847 10 23.4847 10M23.4847 10H1M23.4847 10C23.4847 10 20.9004 11.0612 18.9847 12.1C14.4847 14.54 14.4847 19 14.4847 19"
              stroke="rgba(254, 51, 10, 1)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default ScrollToTop;
