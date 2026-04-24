import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Quote } from "lucide-react";

const testimonials = [
  {
    quote: "Meridian cut our time-to-production in half. The design system alone is worth the switch — everything just works together.",
    name: "Priya Nair",
    role: "CTO at Flowbase",
    initials: "PN",
  },
  {
    quote: "We evaluated six platforms before landing on Meridian. The dark mode, accessibility, and TypeScript support were non-negotiable for us.",
    name: "Marcus Webb",
    role: "Lead Engineer at Arcflow",
    initials: "MW",
  },
  {
    quote: "Our designers love it as much as the engineers. A platform that actually respects both sides of the product team is rare.",
    name: "Elena Sorel",
    role: "Head of Product at Luma",
    initials: "ES",
  },
];

export function TestimonialsSection() {
  return (
    <section className="border-t border-border py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-16 text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">Testimonials</p>
          <h2 className="text-4xl font-heading tracking-tight md:text-5xl">Loved by teams everywhere</h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <Card
              key={t.name}
              className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 flex flex-col [animation-duration:600ms]"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <CardContent className="flex flex-1 flex-col p-6">
                <Quote className="mb-4 h-6 w-6 text-muted-foreground/40" />
                <p className="flex-1 text-sm italic leading-relaxed text-muted-foreground">"{t.quote}"</p>
                <div className="mt-6 flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={`https://avatar.vercel.sh/${t.name}`} alt={t.name} />
                    <AvatarFallback className="text-xs">{t.initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
