export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-8 px-4 py-12">
      <a href="/" className="font-heading text-2xl italic text-foreground">
        Explore NPM
      </a>
      {children}
    </div>
  );
}
