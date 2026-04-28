import { headers } from "next/headers";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { NavbarMobileMenu } from "@/components/layout/NavbarMobileMenu";
import { getSession } from "@/lib/session";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "FAQ", href: "#faq" },
];

export async function Navbar() {
  const session = await getSession(await headers());
  const isLoggedIn = !!session;

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <a href="/" className="font-heading text-xl italic text-foreground">
          Explore NPM
        </a>

        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle className="hidden md:flex" />
          <Button
            size="sm"
            variant="ghost"
            className="hidden md:flex"
            nativeButton={false}
            render={<a href={isLoggedIn ? "/dashboard" : "/sign-in"} />}
          >
            {isLoggedIn ? "Dashboard" : "Log in"}
          </Button>
          <Button size="sm" nativeButton={false} render={<a href="/sign-up" />}>
            Get started
          </Button>
          <NavbarMobileMenu links={navLinks} />
        </div>
      </div>
    </header>
  );
}
