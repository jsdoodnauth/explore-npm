# New Component

Create a new shadcn-compatible React component in `src/components/`.

## Instructions

1. Create the file at `src/components/$ARGUMENTS.tsx`
2. Use TypeScript with proper prop types
3. Use Tailwind CSS for styling via `cn()` from `@/lib/utils`
4. Export the component as a named export
5. Follow the existing shadcn/ui conventions in this project

## Template

```tsx
import { cn } from "@/lib/utils"

interface $ARGUMENTSProps {
  className?: string
}

export function $ARGUMENTS({ className }: $ARGUMENTSProps) {
  return (
    <div className={cn("", className)}>
      {/* component content */}
    </div>
  )
}
```

## After writing the file

Run `npx tsc --noEmit` and fix any TypeScript errors before finishing.
Do not consider the task complete until the type check passes with zero errors.
