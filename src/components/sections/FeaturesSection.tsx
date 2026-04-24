import { Card, CardContent } from "@/components/ui/card";
import { Zap, Shield, Moon, Accessibility, Sliders, Rocket } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Fast Performance",
    description: "Built on Next.js with edge-optimized rendering. Your users get sub-100ms load times, every time.",
  },
  {
    icon: Shield,
    title: "Type-Safe",
    description: "End-to-end TypeScript with strict mode. Catch bugs at compile time, not in production.",
  },
  {
    icon: Moon,
    title: "Dark Mode",
    description: "A dark-first design system with seamless light mode support. Respects system preferences out of the box.",
  },
  {
    icon: Accessibility,
    title: "Accessible",
    description: "WCAG 2.1 AA compliant components built on Radix UI primitives. Inclusive by default.",
  },
  {
    icon: Sliders,
    title: "Fully Customizable",
    description: "CSS variables, Tailwind tokens, and a composable component architecture. Make it yours.",
  },
  {
    icon: Rocket,
    title: "Production Ready",
    description: "Auth, payments, and deployments pre-configured. Go from zero to live in a single afternoon.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="border-t border-border py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-16 text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">Features</p>
          <h2 className="text-4xl font-heading tracking-tight md:text-5xl">Everything you need to ship</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            A complete foundation so you can focus on building your product, not your infrastructure.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.title}
                className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 border-border bg-card transition-colors hover:bg-muted/30 [animation-duration:600ms]"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <CardContent className="p-6">
                  <div className="mb-4 inline-flex rounded-lg bg-muted p-2.5">
                    <Icon className="h-5 w-5 text-foreground" />
                  </div>
                  <h3 className="mb-2 text-base font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
