"use client";

import faq_data from "../../../data/faq-data";
import React, { useState } from "react";
export default function FaqHomeTwo() {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const toggleAccordion = (index: number) => {
    if (activeIndex === index) {
      setActiveIndex(0); 
    } else {
      setActiveIndex(index);  
    }
  };
 

  return (
    <div className="azzle-section-padding pt-0">
        <div className="container">
          <div className="azzle-section-title font-title center max-width-750" data-aos="fade-up" data-aos-delay="500">
            <h2>AI Chatbot FAQs for more information</h2>
          </div>
          <div className="azzle-faq-wrap1 wrap2">
            {faq_data.map((item, i) => (
              <div key={i} className={`azzle-faq-item item2 ${activeIndex === i ? "open" : ""}`} data-aos="fade-up" data-aos-delay={500 + i * 200}>
              <div className="azzle-faq-header header2" onClick={() => toggleAccordion(i)}>
                <h3>{item.question}</h3>
                <div className="azzle-active-icon2">
                  <img className="plasicon" src="assets/images/home1/+.svg" alt="plas" />
                  <img className="mynusicon" src="assets/images/home2/plas+.svg" alt="plas" />
                </div>
              </div>
              <div className="azzle-faq-body body2" style={{ display: activeIndex === i ? "block" : "none" }}>
                <p>{item.answer}</p>
              </div>
            </div>
            ))} 
          </div>
        </div>
      </div>
  );
}
