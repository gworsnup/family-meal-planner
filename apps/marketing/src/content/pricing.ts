export const pricingContent = {
  breadcrumb: { title: "Pricing Plan", page: "Pricing Plan" },
  pricingArea: {
    title: "Find a flexible plan that fits your household",
    billing: { monthlyLabel: "Monthly", yearlyLabel: "Yearly" },
    plans: [
      {
        name: "Free",
        audience: "1 member",
        monthlyPrice: "$0",
        yearlyPrice: "$20",
        description: "Ideal for individuals just getting started.",
        features: [
          "Shared meal plan",
          "Recipe collection",
          "Auto shopping list",
        ],
        ctaLabel: "Start for free",
        ctaHref: "/contact",
      },
      {
        name: "Beginner",
        audience: "Up to 50 members",
        monthlyPrice: "$29",
        yearlyPrice: "$39",
        description: "A great option for small households who want more.",
        features: [
          "Shared meal plan",
          "Recipe collection",
          "Auto shopping list",
          "Meal suggestions",
        ],
        ctaLabel: "Start for free",
        ctaHref: "/contact",
      },
      {
        name: "Starter",
        audience: "Up to 100 members",
        monthlyPrice: "$59",
        yearlyPrice: "$79",
        description: "Perfect for busy families and shared households.",
        features: [
          "Shared meal plan",
          "Recipe collection",
          "Auto shopping list",
          "Meal suggestions",
          "Pantry tracking",
        ],
        ctaLabel: "Start for free",
        ctaHref: "/contact",
        featured: true,
      },
      {
        name: "Pro",
        audience: "Up to 150 members",
        monthlyPrice: "$89",
        yearlyPrice: "$99",
        description: "Best for power planners who want advanced insights.",
        features: [
          "Shared meal plan",
          "Recipe collection",
          "Auto shopping list",
          "Meal suggestions",
          "Pantry tracking",
          "Family analytics",
        ],
        ctaLabel: "Start for free",
        ctaHref: "/contact",
      },
    ],
  },
  faq: {
    title: "Freely ask us for more information",
    description:
      "We’re happy to help you choose the right plan for your household.",
    cta: { label: "Ask your questions", href: "/contact" },
    items: [
      {
        id: 1,
        question: "Do I need a credit card to start?",
        answer: "No, the free plan is available without a credit card.",
      },
      {
        id: 2,
        question: "Can I change plans later?",
        answer:
          "Yes, you can upgrade or downgrade anytime in your account settings.",
      },
      {
        id: 3,
        question: "Does yearly billing save money?",
        answer: "Yes, yearly plans include a discount compared to monthly.",
      },
    ],
  },
};
