"use client";
import Link from "next/link";
import Slider from "react-slick";


const settings = {
  slidesToShow: 4,
  slidesToScroll: 1,
  autoplay: true,
  autoplaySpeed: 0,
  speed: 2000,
  arrows: false,
  pauseOnHover: false,
  cssEase: "linear",
  responsive: [{
    breakpoint: 1399,
    settings: {
      slidesToShow: 3
    }
  }, {
    breakpoint: 991,
    settings: {
      slidesToShow: 4
    }
  }, {
    breakpoint: 767,
    settings: {
      slidesToShow: 3
    }
  }]
}

const settings2 = {
  slidesToShow: 4,
  slidesToScroll: 1,
  autoplay: true,
  autoplaySpeed: 0,
  speed: 2000,
  rtl: true,
  arrows: false,
  pauseOnHover: false,
  cssEase: "linear",
  responsive: [{
    breakpoint: 1399,
    settings: {
      slidesToShow: 3
    }
  }, {
    breakpoint: 991,
    settings: {
      slidesToShow: 4
    }
  }, {
    breakpoint: 767,
    settings: {
      slidesToShow: 3
    }
  }]
}


export default function BrandHomeTwo() {
  return (
    <section className="azzle-section-padding section" style={{ backgroundImage: 'url(/assets/images/home2/in-bg.png)' }}>
      <div className="container">
        <div className="row">
          <div className="col-lg-7 d-flex align-items-center">
            <div className="azzle-default-content content2 content3 pr-110" data-aos="fade-up" data-aos-delay="500">
              <h2>Integrates your favorite channels</h2>
              <p>The ability to integrate AI chatbots into multiple channels enables businesses to meet users where they are, providing a consistent and convenient experience across various touchpoints. </p>
              <div className="azzle-listicon-wrap2 mt-50">
                <ul>
                  <li>
                    <h3>It preferred all communication channels</h3>
                  </li>
                  <li>
                    <h3>Use platform users regardless of support</h3>
                  </li>
                </ul>
              </div>
              <div className="mt-50">
                <Link href="/contact-us" className="azzle-default-btn btn2">
                  Explore Integrations
                  <img src="assets/images/home1/arrow-white.svg" alt="Arrow" />
                </Link>
              </div>
            </div>
          </div>
          <div className="col-lg-5">
            <div className="azzle-int-slider-wraper" data-aos="fade-up" data-aos-delay="700">
              <Slider {...settings} className="azzle-int-slider-init">
                <div className="azzle-int-slider-item">
                  <img src="assets/images/home2/2.svg" alt="Icon" />
                </div>
                <div className="azzle-int-slider-item">
                  <img src="assets/images/home2/3.svg" alt="Icon" />
                </div>
                <div className="azzle-int-slider-item">
                  <img src="assets/images/home2/4.svg" alt="Icon" />
                </div>
                <div className="azzle-int-slider-item">
                  <img src="assets/images/home2/5.svg" alt="Icon" />
                </div>
                <div className="azzle-int-slider-item">
                  <img src="assets/images/home2/2.svg" alt="Icon" />
                </div>
                <div className="azzle-int-slider-item">
                  <img src="assets/images/home2/3.svg" alt="Icon" />
                </div>
                <div className="azzle-int-slider-item">
                  <img src="assets/images/home2/4.svg" alt="Icon" />
                </div>
                <div className="azzle-int-slider-item">
                  <img src="assets/images/home2/5.svg" alt="Icon" />
                </div>
                <div className="azzle-int-slider-item">
                  <img src="assets/images/home2/2.svg" alt="Icon" />
                </div>
                <div className="azzle-int-slider-item">
                  <img src="assets/images/home2/3.svg" alt="Icon" />
                </div>
              </Slider>
              <Slider {...settings2} className="azzle-int-slider-init">
                <div className="azzle-int-slider-item">
                  <img src="assets/images/home2/8.svg" alt="Icon" />
                </div>
                <div className="azzle-int-slider-item">
                  <img src="assets/images/home2/9.svg" alt="Icon" />
                </div>
                <div className="azzle-int-slider-item">
                  <img src="assets/images/home2/10.svg" alt="Icon" />
                </div>
                <div className="azzle-int-slider-item">
                  <img src="assets/images/home2/8.svg" alt="Icon" />
                </div>
                <div className="azzle-int-slider-item">
                  <img src="assets/images/home2/9.svg" alt="Icon" />
                </div>
                <div className="azzle-int-slider-item">
                  <img src="assets/images/home2/10.svg" alt="Icon" />
                </div>
                <div className="azzle-int-slider-item">
                  <img src="assets/images/home2/8.svg" alt="Icon" />
                </div>
                <div className="azzle-int-slider-item">
                  <img src="assets/images/home2/9.svg" alt="Icon" />
                </div>
                <div className="azzle-int-slider-item">
                  <img src="assets/images/home2/10.svg" alt="Icon" />
                </div>
              </Slider>
              <div className="azzle-int-bg">
                <img src="assets/images/home2/shape1.png" alt="shape" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
