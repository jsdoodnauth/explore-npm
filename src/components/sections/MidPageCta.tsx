import { Button } from "@/components/ui/button";

export function MidPageCta() {
  return (
    <section className="border-y border-border bg-muted/30 py-16">
      <div className="mx-auto max-w-6xl px-4 text-center">
        <h2 className="text-3xl font-heading tracking-tight md:text-4xl">Ready to move faster?</h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Join thousands of teams already building on Meridian. No credit card required.
        </p>
        <div className="mt-8">
          <Button size="lg" nativeButton={false} render={<a href="#pricing" />}>
            Start for free
          </Button>
        </div>
      </div>
    </section>
  );
}
