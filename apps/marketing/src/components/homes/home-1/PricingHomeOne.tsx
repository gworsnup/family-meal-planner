"use client";
import Link from "next/link";
import { useState } from "react";

type PricingHomeOneProps = {
  content?: {
    title?: string;
    billing?: { monthlyLabel?: string; yearlyLabel?: string };
    plans?: {
      name?: string;
      audience?: string;
      monthlyPrice?: string;
      yearlyPrice?: string;
      description?: string;
      ctaLabel?: string;
      ctaHref?: string;
      featured?: boolean;
    }[];
  };
};

export default function PricingHomeOne({
  content,
}: PricingHomeOneProps) { 
  const [isMonthly, setIsMonthly] = useState(false);
  const defaultPlans = [
    {
      name: "Beginner",
      audience: "Up to 10 members",
      monthlyPrice: "$25",
      yearlyPrice: "$50",
      description:
        "This is an excellent option for people & small businesses who are starting out.",
      ctaLabel: "Choose the plan",
      ctaHref: "/contact-us",
    },
    {
      name: "Starter",
      audience: "Up to 50 members",
      monthlyPrice: "$89",
      yearlyPrice: "$169",
      description:
        "This plan is suitable for e-commerce stores as well as professional blogs.",
      ctaLabel: "Choose the plan",
      ctaHref: "/contact-us",
      featured: true,
    },
    {
      name: "Pro",
      audience: "Up to 100 members",
      monthlyPrice: "$199",
      yearlyPrice: "$299",
      description:
        "Ideal for handling complicated projects, enterprise-level projects, and websites.",
      ctaLabel: "Choose the plan",
      ctaHref: "/contact-us",
    },
  ];
  const plans = defaultPlans.map((plan, index) => ({
    ...plan,
    ...content?.plans?.[index],
  }));
  const title = content?.title ?? "Cost-effectively build any software";
  const monthlyLabel = content?.billing?.monthlyLabel ?? "Monthly";
  const yearlyLabel = content?.billing?.yearlyLabel ?? "Yearly";

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
          <h2>{title}</h2>
          <div className="azzle-title-pricing-btn mt-50">
            <label htmlFor="toggle" className="toggle-switch">
              <input
                className="toggle-button"
                id="toggle"
                type="checkbox"
                checked={isMonthly}
                onChange={(e) => setIsMonthly(e.target.checked)}
              />
              <span>{monthlyLabel}</span>
              <span>{yearlyLabel}</span>
            </label>
          </div>
        </div>

        <div className="row">
          {plans.map((plan, index) => (
            <div key={plan.name ?? index} className="col-xl-4 col-md-6">
              <div
                className={`azzle-pricing-wrap${plan.featured ? " active" : ""}`}
                data-aos="fade-up"
                data-aos-delay={500 + index * 200}
              >
                <div className="azzle-pricing-header">
                  <h3>{plan.name}</h3>
                  <p>{plan.audience}</p>
                </div>
                {isMonthly ? (
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
                <div className="azzle-pricing-footer mt-50">
                  <Link
                    className={`azzle-default-btn d-block outline-btn${plan.featured ? " btn2" : ""}`}
                    href={plan.ctaHref ?? "/contact-us"}
                  >
                    {plan.ctaLabel}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
