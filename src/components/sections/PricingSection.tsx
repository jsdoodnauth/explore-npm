import { PricingCards } from "@/components/sections/PricingCards";

export function PricingSection() {
  return (
    <section id="pricing" className="border-t border-border py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-16 text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">Pricing</p>
          <h2 className="text-4xl font-heading tracking-tight md:text-5xl">Simple, transparent pricing</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Start free. Scale as you grow. No hidden fees, no surprises.
          </p>
        </div>
        <PricingCards />
      </div>
    </section>
  );
}
