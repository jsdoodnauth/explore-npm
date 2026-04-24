"use client";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Error</p>
      <h1 className="font-heading text-xl font-semibold text-foreground">Something went wrong</h1>
      <p className="text-sm text-muted-foreground max-w-xs">
        An unexpected error occurred loading this page.
      </p>
      {error.digest && (
        <p className="text-xs text-muted-foreground font-mono">ID: {error.digest}</p>
      )}
      <button
        onClick={reset}
        className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
