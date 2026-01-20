"use client";
import Link from "next/link";
import { useState } from "react";

export default function PricingHomeOne() { 
  const [isMonthly, setIsMonthly] = useState(false);

  return (
    <div className="azzle-section-padding2 position-r">
      <div className="azzle-pricing-shape">
        <img src="assets/images/home1/pricing-shape.png" alt="bg" />
      </div>
      <div className="container">
        <div
          className="azzle-section-title center"
          data-aos="fade-up"
          data-aos-delay="500"
        >
          <h2>Cost-effectively build any software</h2>
          <div className="azzle-title-pricing-btn mt-50">
            <label htmlFor="toggle" className="toggle-switch">
              <input
                className="toggle-button"
                id="toggle"
                type="checkbox"
                checked={isMonthly}
                onChange={(e) => setIsMonthly(e.target.checked)}
              />
              <span>Monthly</span>
              <span>Yearly</span>
            </label>
          </div>
        </div>

        <div className="row">
          {/* Beginner */}
          <div className="col-xl-4 col-md-6">
            <div
              className="azzle-pricing-wrap"
              data-aos="fade-up"
              data-aos-delay="500"
            >
              <div className="azzle-pricing-header">
                <h3>Beginner</h3>
                <p>Up to 10 members</p>
              </div>
              {isMonthly ? (
                <div className="azzle-pricing-price">
                  <h2>$50</h2>
                  <span>/Per Year</span>
                </div>
              ) : (
                <div className="azzle-pricing-price">
                  <h2>$25</h2>
                  <span>/Per Month</span>
                </div>
              )}
              <div className="azzle-pricing-body">
                <p>
                  This is an excellent option for people & small businesses who
                  are starting out.
                </p>
              </div>
              <div className="azzle-pricing-footer mt-50">
                <Link
                  className="azzle-default-btn d-block outline-btn"
                  href="/contact-us"
                >
                  Choose the plan
                </Link>
              </div>
            </div>
          </div>

          {/* Starter */}
          <div className="col-xl-4 col-md-6">
            <div
              className="azzle-pricing-wrap active"
              data-aos="fade-up"
              data-aos-delay="700"
            >
              <div className="azzle-pricing-header">
                <h3>Starter</h3>
                <p>Up to 50 members</p>
              </div>
              {isMonthly ? (
                <div className="azzle-pricing-price">
                  <h2>$169</h2>
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
                  This plan is suitable for e-commerce stores as well as
                  professional blogs.
                </p>
              </div>
              <div className="azzle-pricing-footer mt-50">
                <Link
                  className="azzle-default-btn d-block outline-btn btn2"
                  href="/contact-us"
                >
                  Choose the plan
                </Link>
              </div>
            </div>
          </div>

          {/* Pro */}
          <div className="col-xl-4 col-md-6">
            <div
              className="azzle-pricing-wrap"
              data-aos="fade-up"
              data-aos-delay="900"
            >
              <div className="azzle-pricing-header">
                <h3>Pro</h3>
                <p>Up to 100 members</p>
              </div>
              {isMonthly ? (
                <div className="azzle-pricing-price">
                  <h2>$299</h2>
                  <span>/Per Year</span>
                </div>
              ) : (
                <div className="azzle-pricing-price">
                  <h2>$199</h2>
                  <span>/Per Month</span>
                </div>
              )}
              <div className="azzle-pricing-body">
                <p>
                  Ideal for handling complicated projects, enterprise-level
                  projects, and websites.
                </p>
              </div>
              <div className="azzle-pricing-footer mt-50">
                <Link
                  className="azzle-default-btn d-block outline-btn"
                  href="/contact-us"
                >
                  Choose the plan
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
