export const homeContent = {
  hero: {
    headline: "No more “what’s for dinner?”",
    subheadline: "Collect recipes, plan meals, and streamline shopping in one shared space.",
    primaryCta: { label: "Sign up free", href: "https://app.familytable.me/" },
    secondaryCta: { label: "See how it works", href: "/features" },
    imageSrc: "/assets/images/home1/Dashboard1.png",
    imageAlt: "FamilyTable meal planning",
    brandLine: "Families of all sizes trust FamilyTable to plan together and shop smarter.",
  },
  featureGrid: {
    title: "Core features that make it valuable",
    items: [
      {
        title: "Recipe collection",
        description: "Save recipes from anywhere and keep everyone’s favorites in one place.",
        href: "/features",
      },
      {
        title: "Weekly meal planning",
        description: "Drag and drop meals onto a shared calendar in minutes.",
        href: "/features",
      },
      {
        title: "Smart shopping lists",
        description: "Auto-build lists from your plan and organize by aisle.",
        href: "/features",
      },
      {
        title: "Family collaboration",
        description: "Invite household members to vote, comment, and add requests.",
        href: "/features",
      },
    ],
  },
  about: {
    sections: [
      {
        imageSrc: "/assets/images/home1/thumb2.png",
        imageAlt: "Meal planning overview",
        title: "Accessible meal planning for every household",
        paragraphs: [
          "FamilyTable brings advanced planning tools to busy families without the learning curve.",
          "Plan from anywhere and keep everyone aligned on what’s for dinner.",
        ],
      },
      {
        imageSrc: "/assets/images/home1/thumb1.png",
        imageAlt: "Shopping list preview",
        title: "Shop faster with smart lists",
        paragraphs: [
          "Generate grocery lists automatically from your weekly plan and keep them synced.",
        ],
        listItems: [
          "Auto-organized lists by aisle",
          "Real-time updates for the whole household",
          "Less waste with smarter planning",
        ],
      },
    ],
  },
  video: {
    imageSrc: "/assets/images/home1/thumb3.png",
    imageAlt: "FamilyTable demo",
    videoUrl: "https://www.youtube.com/watch?v=zE_WFiHnSlY",
    title: "See meal planning in action",
    description:
      "From recipes to grocery runs, FamilyTable keeps your week organized and stress-free.",
    stats: [
      { value: "92%", label: "Families report fewer last-minute takeout runs" },
      { value: "75%", label: "Households spend less time planning meals" },
    ],
  },
  pricing: {
    title: "Simple plans for every household",
    billing: { monthlyLabel: "Monthly", yearlyLabel: "Yearly" },
    plans: [
      {
        name: "Starter",
        audience: "Up to 2 members",
        monthlyPrice: "$0",
        yearlyPrice: "$0",
        description: "Perfect for trying out shared meal planning.",
        ctaLabel: "Choose the plan",
        ctaHref: "/contact",
      },
      {
        name: "Family",
        audience: "Up to 6 members",
        monthlyPrice: "$8",
        yearlyPrice: "$80",
        description: "Everything you need for a busy household.",
        ctaLabel: "Choose the plan",
        ctaHref: "/contact",
        featured: true,
      },
      {
        name: "Plus",
        audience: "Unlimited members",
        monthlyPrice: "$15",
        yearlyPrice: "$150",
        description: "For larger families or shared households.",
        ctaLabel: "Choose the plan",
        ctaHref: "/contact",
      },
    ],
  },
  faq: {
    title: "Questions about getting started?",
    description:
      "We’re here to help you set up FamilyTable and keep everyone in sync.",
    cta: { label: "Ask your questions", href: "/contact" },
    items: [
      {
        id: 1,
        question: "How do I start planning meals?",
        answer:
          "Create a free account, add your favorite recipes, and drag meals onto the weekly planner.",
      },
      {
        id: 2,
        question: "Can I share plans with my family?",
        answer:
          "Yes. Invite household members so everyone can see the plan and add requests.",
      },
      {
        id: 3,
        question: "Do shopping lists update automatically?",
        answer:
          "Every planned meal adds items to your list, and changes sync in real time.",
      },
    ],
  },
  testimonial: {
    title: "Positive feedback from our users",
    items: [
      {
        quote:
          "FamilyTable has completely changed how we plan dinners. We waste less food and stress less.",
        name: "Max Weber",
        role: "Busy parent",
        imageSrc: "/assets/images/home1/author1.png",
        imageAlt: "Max Weber",
      },
      {
        quote:
          "Planning the week is so fast now, and the grocery list builds itself.",
        name: "Douglas Smith",
        role: "Home cook",
        imageSrc: "/assets/images/home1/author2.png",
        imageAlt: "Douglas Smith",
      },
      {
        quote:
          "Our kids can vote on meals, which makes dinner decisions way easier.",
        name: "Abraham Maslo",
        role: "Parent",
        imageSrc: "/assets/images/home1/author3.png",
        imageAlt: "Abraham Maslo",
      },
      {
        quote:
          "The shared list is a lifesaver. Everyone adds what they need and it stays organized.",
        name: "Jack Fayol",
        role: "Household planner",
        imageSrc: "/assets/images/home1/author4.png",
        imageAlt: "Jack Fayol",
      },
      {
        quote:
          "FamilyTable helped us stick to our budget without giving up variety.",
        name: "Karen Lynn",
        role: "Meal prep enthusiast",
        imageSrc: "/assets/images/home1/author5.png",
        imageAlt: "Karen Lynn",
      },
      {
        quote:
          "It’s the first time our whole family is on the same page about dinner.",
        name: "Henry Ochi",
        role: "Dad of three",
        imageSrc: "/assets/images/home1/author6.png",
        imageAlt: "Henry Ochi",
      },
    ],
  },
};
