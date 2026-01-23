"use client";
import Link from "next/link";
import { useState } from "react";

type PricingPlan = {
  name: string;
  audience: string;
  monthlyPrice: string;
  yearlyPrice: string;
  description: string;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
  featured?: boolean;
};

type PricingAreaProps = {
  content?: {
    title?: string;
    billing?: { monthlyLabel?: string; yearlyLabel?: string };
    plans?: Partial<PricingPlan>[];
  };
};

export default function PricingArea({ content }: PricingAreaProps) {
  const [isYearly, setIsYearly] = useState(false);
  const defaultPlans: PricingPlan[] = [
    {
      name: "Free",
      audience: "1 member",
      monthlyPrice: "$0",
      yearlyPrice: "$20",
      description:
        "Ideal for individuals person and small businesses just getting started.",
      features: [
        "AI-Ready Data Prep",
        "Feature Engineering",
        "Classification Models",
      ],
      ctaLabel: "Start for free",
      ctaHref: "/contact-us",
    },
    {
      name: "Beginner",
      audience: "Up to 50 members",
      monthlyPrice: "$29",
      yearlyPrice: "$39",
      description: "This is an excellent option for small businesses who are starting out.",
      features: [
        "AI-Ready Data Prep",
        "Feature Engineering",
        "Classification Models",
        "Regression Models",
      ],
      ctaLabel: "Start for free",
      ctaHref: "/contact-us",
    },
    {
      name: "Starter",
      audience: "Up to 100 members",
      monthlyPrice: "$59",
      yearlyPrice: "$79",
      description:
        "This plan is suitable for e-commerce stores as well as professional blogs.",
      features: [
        "AI-Ready Data Prep",
        "Feature Engineering",
        "Classification Models",
        "Regression Models",
        "Time Series Models",
      ],
      ctaLabel: "Start for free",
      ctaHref: "/contact-us",
      featured: true,
    },
    {
      name: "Pro",
      audience: "Up to 150 members",
      monthlyPrice: "$89",
      yearlyPrice: "$99",
      description:
        "Ideal for complex websites, online platforms, enterprise-level projects.",
      features: [
        "AI-Ready Data Prep",
        "Feature Engineering",
        "Classification Models",
        "Regression Models",
        "Time Series Models",
        "Clustering models",
      ],
      ctaLabel: "Start for free",
      ctaHref: "/contact-us",
    },
  ];
  const plans = defaultPlans.map((plan, index) => ({
    ...plan,
    ...content?.plans?.[index],
  }));
  const title = content?.title ?? "Find a flexible plan that fits your business";
  const monthlyLabel = content?.billing?.monthlyLabel ?? "Monthly";
  const yearlyLabel = content?.billing?.yearlyLabel ?? "Yearly";

  return (
    <div className="azzle-section-pt">
      <div className="container">
        <div
          className="azzle-section-title center max-width-850"
          data-aos="fade-up"
          data-aos-delay="500"
        >
          <h2>{title}</h2>
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
              <span>{monthlyLabel}</span>
              <span>{yearlyLabel}</span>
            </label>
          </div>
        </div>

        <div className="row">
          {plans.map((plan, index) => {
            const checkIcon = plan.featured
              ? "assets/images/home1/check2.png"
              : "assets/images/home1/check.png";

            return (
              <div key={plan.name} className="col-xxl-3 col-md-6">
                <div className="azzle-pricing-column">
                  <div
                    className={`azzle-pricing-wrap wrap2${plan.featured ? " active" : ""}`}
                    data-aos="fade-up"
                    data-aos-delay={500 + index * 200}
                  >
                    <div className="azzle-pricing-top">
                      <div className="azzle-pricing-header">
                        <h3>{plan.name}</h3>
                        <p>{plan.audience}</p>
                      </div>

                      {isYearly ? (
                        <div className="azzle-pricing-price">
                          <h2>{plan.yearlyPrice}</h2>
                          <span>/Per Year</span>
                        </div>
                      ) : (
                        <div className="azzle-pricing-price">
                          <h2>{plan.monthlyPrice}</h2>
                          <span>/Per Month</span>
                        </div>
                      )}

                      <div className="azzle-pricing-body">
                        <p>{plan.description}</p>
                      </div>
                      <div className="azzle-pricing-feature">
                        <ul>
                          {plan.features.map((feature) => (
                            <li key={feature}>
                              <img src={checkIcon} alt="ratting" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className="azzle-pricing-footer mt-50">
                      <Link
                        className={`azzle-default-btn d-block outline-btn${plan.featured ? " btn2" : ""}`}
                        href={plan.ctaHref}
                      >
                        {plan.ctaLabel}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
