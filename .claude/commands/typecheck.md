# Typecheck

Run the TypeScript compiler in check-only mode and fix any errors found.

## Instructions

1. Run `npx tsc --noEmit` in the project root
2. If there are errors, read each affected file and fix the type issues
3. Re-run `npx tsc --noEmit` to confirm zero errors
4. Do not consider this task complete until the output is clean

## Common errors in this project

- `Button asChild` — this project uses `@base-ui/react`. Use `render={<a href="..." />}` instead of `asChild`
- `Accordion type="single" collapsible` — use `multiple={false}` instead
- Missing return types — add explicit return types to exported functions if tsc requires them
