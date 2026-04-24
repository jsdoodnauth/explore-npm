import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { HeroVisual } from "@/components/sections/HeroVisual";

const socialProofAvatars = [
  { name: "Alex Chen", initials: "AC" },
  { name: "Sara Kim", initials: "SK" },
  { name: "James Wu", initials: "JW" },
];

export function HeroSection() {
  return (
    <section className="mx-auto flex min-h-[85vh] max-w-6xl flex-col items-center justify-center px-4 py-24 text-center md:py-32">
      <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 [animation-delay:0ms] [animation-duration:600ms]">
        <Badge variant="secondary" className="mb-6">
          Now in public beta
        </Badge>
      </div>

      <h1 className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 max-w-3xl text-5xl font-heading leading-tight tracking-tight md:text-7xl [animation-delay:100ms] [animation-duration:600ms]">
        The platform <em>built</em> for modern teams
      </h1>

      <p className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 mt-6 max-w-2xl text-lg text-muted-foreground [animation-delay:200ms] [animation-duration:600ms]">
        Meridian gives your team the tools to ship faster, collaborate seamlessly, and scale with confidence — all in one elegant platform.
      </p>

      <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 mt-10 flex flex-col items-center gap-4 sm:flex-row [animation-delay:300ms] [animation-duration:600ms]">
        <Button size="lg" nativeButton={false} render={<a href="#pricing" />}>
          Get started free
        </Button>
        <Button size="lg" variant="outline" nativeButton={false} render={<a href="#features" />}>
          See how it works
        </Button>
      </div>

      <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 mt-8 flex items-center gap-3 [animation-delay:400ms] [animation-duration:600ms]">
        <div className="flex -space-x-2">
          {socialProofAvatars.map((avatar) => (
            <Avatar key={avatar.name} className="h-7 w-7 border-2 border-background">
              <AvatarImage src={`https://avatar.vercel.sh/${avatar.name}`} alt={avatar.name} />
              <AvatarFallback className="text-xs">{avatar.initials}</AvatarFallback>
            </Avatar>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          Trusted by <span className="text-foreground">2,000+</span> teams
        </p>
      </div>

      <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-8 w-full [animation-delay:600ms] [animation-duration:800ms]">
        <HeroVisual />
      </div>
    </section>
  );
}
