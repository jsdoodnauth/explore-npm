import { FaqAccordion } from "@/components/sections/FaqAccordion";

export function FaqSection() {
  return (
    <section id="faq" className="border-t border-border py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-16 text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">FAQ</p>
          <h2 className="text-4xl font-heading tracking-tight md:text-5xl">Questions & answers</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Everything you need to know. Can't find what you're looking for?{" "}
            <a href="#" className="text-foreground underline underline-offset-4 transition-opacity hover:opacity-70">
              Talk to us.
            </a>
          </p>
        </div>
        <div className="mx-auto max-w-3xl">
          <FaqAccordion />
        </div>
      </div>
    </section>
  );
}
