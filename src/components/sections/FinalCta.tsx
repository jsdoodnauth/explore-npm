import { Button } from "@/components/ui/button";

export function FinalCta() {
  return (
    <section className="border-t border-border bg-card py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-4 text-center">
        <h2 className="mx-auto max-w-2xl text-4xl font-heading tracking-tight md:text-5xl">
          Start building with <em>Meridian</em> today
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
          Join thousands of teams shipping faster. Free to start, no credit card required.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button size="lg" nativeButton={false} render={<a href="#pricing" />}>
            Start for free
          </Button>
          <Button size="lg" variant="outline" nativeButton={false} render={<a href="#" />}>
            Talk to sales
          </Button>
        </div>
      </div>
    </section>
  );
}
