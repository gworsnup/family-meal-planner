"use client";
import Link from "next/link";
import { useState } from "react";

export default function PricingArea() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <div className="azzle-section-pt">
      <div className="container">
        <div
          className="azzle-section-title center max-width-850"
          data-aos="fade-up"
          data-aos-delay="500"
        >
          <h2>Find a flexible plan that fits your business</h2>
        </div>
        <div
          className="azzle-section-title center"
          data-aos="fade-up"
          data-aos-delay="500"
        >
          <div className="azzle-title-pricing-btn">
            <label htmlFor="toggle" className="toggle-switch">
              <input
                className="toggle-button"
                id="toggle"
                type="checkbox"
                checked={isYearly}
                onChange={(e) => setIsYearly(e.target.checked)}
              />
              <span>Monthly</span>
              <span>Yearly</span>
            </label>
          </div>
        </div>

        <div className="row">
          {/* Free */}
          <div className="col-xxl-3 col-md-6">
            <div className="azzle-pricing-column">
              <div
                className="azzle-pricing-wrap wrap2"
                data-aos="fade-up"
                data-aos-delay="500"
              >
                <div className="azzle-pricing-top">
                  <div className="azzle-pricing-header">
                    <h3>Free</h3>
                    <p>1 member</p>
                  </div>

                  {isYearly ? (
                    <div className="azzle-pricing-price">
                      <h2>$20</h2>
                      <span>/Per Year</span>
                    </div>
                  ) : (
                    <div className="azzle-pricing-price">
                      <h2>$0</h2>
                      <span>/Per Month</span>
                    </div>
                  )}

                  <div className="azzle-pricing-body">
                    <p>
                      Ideal for individuals person and small businesses just
                      getting started.
                    </p>
                  </div>
                  <div className="azzle-pricing-feature">
                    <ul>
                      <li>
                        <img
                          src="assets/images/home1/check.png"
                          alt="ratting"
                        />
                        AI-Ready Data Prep
                      </li>
                      <li>
                        <img
                          src="assets/images/home1/check.png"
                          alt="ratting"
                        />
                        Feature Engineering
                      </li>
                      <li>
                        <img
                          src="assets/images/home1/check.png"
                          alt="ratting"
                        />
                        Classification Models
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="azzle-pricing-footer mt-50">
                  <Link
                    className="azzle-default-btn d-block outline-btn"
                    href="/contact-us"
                  >
                    Start for free
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Beginner */}
          <div className="col-xxl-3 col-md-6">
            <div className="azzle-pricing-column">
              <div
                className="azzle-pricing-wrap wrap2"
                data-aos="fade-up"
                data-aos-delay="700"
              >
                <div className="azzle-pricing-top">
                  <div className="azzle-pricing-header">
                    <h3>Beginner</h3>
                    <p>Up to 50 members</p>
                  </div>

                  {isYearly ? (
                    <div className="azzle-pricing-price">
                      <h2>$39</h2>
                      <span>/Per Year</span>
                    </div>
                  ) : (
                    <div className="azzle-pricing-price">
                      <h2>$29</h2>
                      <span>/Per Month</span>
                    </div>
                  )}

                  <div className="azzle-pricing-body">
                    <p>
                      This is an excellent option for small businesses who are
                      starting out.
                    </p>
                  </div>
                  <div className="azzle-pricing-feature">
                    <ul>
                      <li>
                        <img
                          src="assets/images/home1/check.png"
                          alt="ratting"
                        />
                        AI-Ready Data Prep
                      </li>
                      <li>
                        <img
                          src="assets/images/home1/check.png"
                          alt="ratting"
                        />
                        Feature Engineering
                      </li>
                      <li>
                        <img
                          src="assets/images/home1/check.png"
                          alt="ratting"
                        />
                        Classification Models
                      </li>
                      <li>
                        <img
                          src="assets/images/home1/check.png"
                          alt="ratting"
                        />
                        Regression Models
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="azzle-pricing-footer mt-50">
                  <Link
                    className="azzle-default-btn d-block outline-btn"
                    href="/contact-us"
                  >
                    Start for free
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Starter */}
          <div className="col-xxl-3 col-md-6">
            <div className="azzle-pricing-column">
              <div
                className="azzle-pricing-wrap wrap2 active"
                data-aos="fade-up"
                data-aos-delay="900"
              >
                <div className="azzle-pricing-top">
                  <div className="azzle-pricing-header">
                    <h3>Starter</h3>
                    <p>Up to 100 members</p>
                  </div>

                  {isYearly ? (
                    <div className="azzle-pricing-price">
                      <h2>$79</h2>
                      <span>/Per Year</span>
                    </div>
                  ) : (
                    <div className="azzle-pricing-price">
                      <h2>$59</h2>
                      <span>/Per Month</span>
                    </div>
                  )}

                  <div className="azzle-pricing-body">
                    <p>
                      This plan is suitable for e-commerce stores as well as
                      professional blogs.
                    </p>
                  </div>
                  <div className="azzle-pricing-feature">
                    <ul>
                      <li>
                        <img
                          src="assets/images/home1/check2.png"
                          alt="ratting"
                        />
                        AI-Ready Data Prep
                      </li>
                      <li>
                        <img
                          src="assets/images/home1/check2.png"
                          alt="ratting"
                        />
                        Feature Engineering
                      </li>
                      <li>
                        <img
                          src="assets/images/home1/check2.png"
                          alt="ratting"
                        />
                        Classification Models
                      </li>
                      <li>
                        <img
                          src="assets/images/home1/check2.png"
                          alt="ratting"
                        />
                        Regression Models
                      </li>
                      <li>
                        <img
                          src="assets/images/home1/check2.png"
                          alt="ratting"
                        />
                        Time Series Models
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="azzle-pricing-footer mt-50">
                  <Link
                    className="azzle-default-btn d-block outline-btn btn2"
                    href="/contact-us"
                  >
                    Start for free
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Pro */}
          <div className="col-xxl-3 col-md-6">
            <div className="azzle-pricing-column">
              <div
                className="azzle-pricing-wrap wrap2"
                data-aos="fade-up"
                data-aos-delay="1100"
              >
                <div className="azzle-pricing-top">
                  <div className="azzle-pricing-header">
                    <h3>Pro</h3>
                    <p>Up to 150 members</p>
                  </div>

                  {isYearly ? (
                    <div className="azzle-pricing-price">
                      <h2>$99</h2>
                      <span>/Per Year</span>
                    </div>
                  ) : (
                    <div className="azzle-pricing-price">
                      <h2>$89</h2>
                      <span>/Per Month</span>
                    </div>
                  )}

                  <div className="azzle-pricing-body">
                    <p>
                      Ideal for complex websites, online platforms,
                      enterprise-level projects.
                    </p>
                  </div>
                  <div className="azzle-pricing-feature">
                    <ul>
                      <li>
                        <img
                          src="assets/images/home1/check.png"
                          alt="ratting"
                        />
                        AI-Ready Data Prep
                      </li>
                      <li>
                        <img
                          src="assets/images/home1/check.png"
                          alt="ratting"
                        />
                        Feature Engineering
                      </li>
                      <li>
                        <img
                          src="assets/images/home1/check.png"
                          alt="ratting"
                        />
                        Classification Models
                      </li>
                      <li>
                        <img
                          src="assets/images/home1/check.png"
                          alt="ratting"
                        />
                        Regression Models
                      </li>
                      <li>
                        <img
                          src="assets/images/home1/check.png"
                          alt="ratting"
                        />
                        Time Series Models
                      </li>
                      <li>
                        <img
                          src="assets/images/home1/check.png"
                          alt="ratting"
                        />
                        Clustering models
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="azzle-pricing-footer mt-50">
                  <Link
                    className="azzle-default-btn d-block outline-btn"
                    href="/contact-us"
                  >
                    Start for free
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
