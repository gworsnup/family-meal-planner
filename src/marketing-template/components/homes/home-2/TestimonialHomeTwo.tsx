"use client";
import Slider from "react-slick"; 

function PrevArrow(props: any) {
  const { onClick } = props;
  return (
    <button
      className={`slide-arrow azzle-t-slider-prev `}
      onClick={onClick}
    >
    </button>
  );
}

function NextArrow(props: any) {
  const { onClick } = props;
  return (
    <button
      className={`slide-arrow azzle-t-slider-next `}
      onClick={onClick}
    >
    </button>
  );
}




export default function TestimonialHomeTwo() {
  const settings = {
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: false,
    infinite: true,
    speed: 1500,
    lazyLoad: "progressive" as const,
    arrows: true,
    prevArrow: <NextArrow />,
    nextArrow: <PrevArrow />,
  };


  return (
    <div className="azzle-section-padding">
      <div className="container">
        <div className="azzle-section-title center font-title max-width-750">
          <h2>Check user reviews using our AI chatbot</h2>
        </div>
        <Slider {...settings} className="azzle-t-slider-init">
          <div className="azzle-t-wrap">
            <div className="azzle-t-thumb" data-aos="zoom-in" data-aos-delay="500">
              <img src="assets/images/home2/t-thumb1.png" alt="Thumb" />
            </div>
            <div className="azzle-default-content content4" data-aos="fade-up" data-aos-delay="700">
              <h3>“Easy to use AI Chatbot with many options”</h3>
              <p>I have been using AI chatbots for several chatbots for the past year. I learned quickly and exploring the tool, & asking questions to Slack support. The tool is very easy user-friendly and the support group helps quickly and thoroughly. Keep up the good work!</p>
              <div className="mt-50">
                <div className="azzle-t-author-title">
                  <p>-Henry Fayol</p>
                  <span>Professional blog writer</span>
                </div>
              </div>
            </div>
          </div>
          <div className="azzle-t-wrap">
            <div className="azzle-t-thumb">
              <img src="assets/images/home2/t-thumb2.png" alt="Thumb" />
            </div>
            <div className="azzle-default-content content4">
              <h3>“Great tool and has excellent support”</h3>
              <p>I am using AI Chatbot for my study purpose. I am a science student and it is helping me to understand concepts easily and I can learn about anything right from it. it motivates me to learn more. The tool is very user-friendly. I love it!</p>
              <div className="mt-50">
                <div className="azzle-t-author-title">
                  <p>-Willium Patters</p>
                  <span>Student</span>
                </div>
              </div>
            </div>
          </div>
          <div className="azzle-t-wrap">
            <div className="azzle-t-thumb">
              <img src="assets/images/home2/t-thumb3.png" alt="Thumb" />
            </div>
            <div className="azzle-default-content content4">
              <h3>“ Best AI Chat tool for mobile phone”</h3>
              <p>II was looking for a chatbot to optimize the workload of our sales team and sent inquiries to almost every chatbot/live chat company. They immediately answered my inquiry and set a meeting to understand our needs. Thanks for the great service</p>
              <div className="mt-50">
                <div className="azzle-t-author-title">
                  <p>-Max Taylor</p>
                  <span>Sales Manager</span>
                </div>
              </div>
            </div>
          </div>
        </Slider>
      </div>
    </div>
  )
}
