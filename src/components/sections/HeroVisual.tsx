export function HeroVisual() {
  return (
    <div className="relative mx-auto mt-16 h-80 w-full max-w-2xl md:h-96">
      {/* Blurred background orbs */}
      <div className="animate-pulse-slow absolute left-1/4 top-1/4 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />
      <div className="animate-pulse-slow absolute right-1/4 top-3/4 h-64 w-64 -translate-y-1/2 translate-x-1/2 rounded-full bg-muted-foreground/10 blur-3xl [animation-delay:1500ms]" />

      {/* Geometric grid of dots */}
      <div className="animate-float absolute inset-0 flex items-center justify-center">
        <div className="grid grid-cols-8 gap-4 opacity-30">
          {Array.from({ length: 64 }).map((_, i) => (
            <div
              key={i}
              className="h-1 w-1 rounded-full bg-foreground"
              style={{ opacity: Math.random() > 0.4 ? 1 : 0.2 }}
            />
          ))}
        </div>
      </div>

      {/* Center ring stack */}
      <div className="animate-float absolute inset-0 flex items-center justify-center [animation-delay:500ms]">
        <div className="relative flex h-40 w-40 items-center justify-center">
          <div className="animate-pulse-slow absolute h-40 w-40 rounded-full border border-border/40 [animation-delay:0ms]" />
          <div className="animate-pulse-slow absolute h-28 w-28 rounded-full border border-border/60 [animation-delay:700ms]" />
          <div className="animate-pulse-slow absolute h-16 w-16 rounded-full border border-border/80 [animation-delay:1400ms]" />
          <div className="h-4 w-4 rounded-full bg-foreground/60" />
        </div>
      </div>

      {/* Floating lines */}
      <div className="animate-float absolute inset-x-8 top-8 h-px bg-gradient-to-r from-transparent via-border to-transparent [animation-delay:200ms]" />
      <div className="animate-float absolute inset-x-8 bottom-8 h-px bg-gradient-to-r from-transparent via-border to-transparent [animation-delay:800ms]" />
      <div className="animate-float absolute inset-y-8 left-8 w-px bg-gradient-to-b from-transparent via-border to-transparent [animation-delay:400ms]" />
      <div className="animate-float absolute inset-y-8 right-8 w-px bg-gradient-to-b from-transparent via-border to-transparent [animation-delay:1000ms]" />
    </div>
  );
}
