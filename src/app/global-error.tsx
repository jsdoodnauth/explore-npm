"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-svh items-center justify-center bg-background p-6 font-sans antialiased">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
            Something went wrong
          </p>
          <h1 className="font-heading text-2xl font-semibold text-foreground">
            Unexpected error
          </h1>
          <p className="text-sm text-muted-foreground">
            An unexpected error occurred. If this keeps happening, please contact support.
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground font-mono">
              Error ID: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            className="mt-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
