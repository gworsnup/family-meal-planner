 
interface FaqItem {
  id: number;
  question: string;
  answer: string;
}

const faq_data: FaqItem[] = [
  {
    id: 1,
    question: "How does an AI chatbot work?",
    answer:
      "AI chatbots work by analyzing user input, understanding the intent behind the message, and providing relevant responses based on pre-defined rules or machine learning models. They can learn from user interactions to improve over time.",
  },
  {
    id: 2,
    question: "What are the benefits of using AI chatbots?",
    answer:
      "AI chatbots offer 24/7 availability, cost savings, efficiency, consistency, instant responses, scalability, and the ability to handle repetitive tasks. They can enhance user experiences and streamline operations in businesses.",
  },
  {
    id: 3,
    question: "Can AI chatbots understand multiple languages?",
    answer:
      "Yes, many AI chatbots are designed to understand and communicate in multiple languages, making them accessible to a global audience.",
  },
  {
    id: 4,
    question: "Can AI chatbots provide personalized responses?",
    answer:
      "Advanced AI chatbots can provide personalized responses by using data from past interactions to tailor their answers to individual user preferences and needs.",
  },
  {
    id: 5,
    question: "How can I integrate an AI chatbot into my business or website?",
    answer:
      "Integrating an AI chatbot typically involves selecting a chatbot platform, customizing it to your specific needs, and integrating it into your chosen communication channels, such as your website or messaging apps.",
  },
];


export default faq_data;