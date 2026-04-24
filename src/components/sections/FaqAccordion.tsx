"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Is there a free plan?",
    answer: "Yes. The Starter plan is completely free, forever. No credit card required. You can upgrade at any time as your needs grow.",
  },
  {
    question: "Can I cancel my subscription at any time?",
    answer: "Absolutely. You can cancel your subscription at any time from your account settings. You'll retain access until the end of your billing period.",
  },
  {
    question: "Do you offer a free trial for paid plans?",
    answer: "Yes, the Pro plan includes a 14-day free trial. No credit card is required to start your trial.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards (Visa, Mastercard, Amex) as well as PayPal. Enterprise customers can also pay via invoice.",
  },
  {
    question: "Is my data secure?",
    answer: "Security is our top priority. All data is encrypted at rest and in transit. We are SOC 2 Type II compliant and undergo regular third-party security audits.",
  },
  {
    question: "Can I self-host Meridian?",
    answer: "Self-hosting is available on the Enterprise plan. Contact our team to discuss your infrastructure requirements and we'll work out the right setup for you.",
  },
  {
    question: "Do you offer discounts for nonprofits or startups?",
    answer: "Yes. We offer a 50% discount for registered nonprofits and early-stage startups. Reach out to our team with proof of eligibility.",
  },
];

export function FaqAccordion() {
  return (
    <Accordion multiple={false} className="w-full">
      {faqs.map((faq, i) => (
        <AccordionItem key={i} value={`item-${i}`}>
          <AccordionTrigger className="text-left text-sm font-medium">
            {faq.question}
          </AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground">
            {faq.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
