"use client";
import { useState } from "react";


interface FaqItem {
  id: number;
  question: string;
  answer: string;
}


const faq_data: FaqItem[] = [
  {
    id: 1,
    question: "What is Artificial Intelligence (AI)?",
    answer:
      "enabling them to perform tasks that typically require AI refers to the simulation of human intelligence in machines,  human intelligence, such as learning, reasoning, problem-solving, and decision-making.",
  },
  {
    id: 2,
    question: "What are the different types of AI?",
    answer:
      "Narrow or Weak AI (focused on specific tasks), AI can be categorized into three types:  General or Strong AI (possessing human-like intelligence across various domains), and Superintelligent AI (a hypothetical form that surpasses human intelligence).",
  },
  {
    id: 3,
    question: "What are some practical applications of AI?",
    answer:
      "utonomous vehicles, natural language processing, AI is used in diverse applications, including a image and speech recognition, recommendation systems, healthcare diagnostics, and robotics.",
  },
  {
    id: 4,
    question: "What is the difference between AI and machine learning?",
    answer:
      "concept of creating intelligent machines, AI is the broader  while machine learning is a subset of AI that focuses on training algorithms to improve their performance on specific tasks.",
  },
  {
    id: 5,
    question: "How can businesses use AI for competitive advantage?",
    answer:
      "Businesses can use AI to gain insights from data, improve customer experiences, optimize operations, enhance decision-making, and develop innovative products.",
  },
  {
    id: 6,
    question: "Can AI replace humans in the workforce?",
    answer:
      "unlikely to replace humans entirely AI can automate certain tasks and processes but is . Instead, it often enhances human productivity and efficiency across industries.",
  },
  {
    id: 7,
    question: "Is AI safe?",
    answer:
      "considerations AI systems are generally safe when designed and tested properly. However, safety measures, ethical, and safeguards against unintended consequences are essential in AI development.",
  },
  {
    id: 8,
    question: "What is the future of AI?",
    answer:
      "The future of AI is expected to involve increased integration into everyday life, advancements in autonomous systems, improved AI-driven healthcare, and further breakthroughs in natural language processing and robotics.",
  },
];


export default function FaqArea() {

  const [openIndex, setOpenIndex] = useState<number>(0);

  const toggleAccordion = (index: number) => {
    if (openIndex === index) {
      setOpenIndex(-1);
    } else {
      setOpenIndex(index);
    }
  };


  return (
    <div className="azzle-section-padding">
      <div className="container">
        <div className="azzle-section-title center max-width-950" data-aos="fade-up" data-aos-delay="500">
          <h2>Our experts are able to answer all your questions</h2>
        </div>
        <div className="azzle-faq-wrap1 faq-page" data-aos="fade-up" data-aos-delay="700">
          {faq_data.map((item, i) => (
            <div key={i} className={`azzle-faq-item ${openIndex === i ? 'open' : ''}`}>
              <div className="azzle-faq-header" onClick={() => toggleAccordion(i)}>
                <h3>{item.question}</h3>
                <div className="azzle-active-icon">
                  <img src="assets/images/home1/+.svg" alt="plas" />
                </div>
              </div>
              <div className="azzle-faq-body" style={{ display: openIndex === i ? 'block' : 'none' }}>
                <p>{item.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
