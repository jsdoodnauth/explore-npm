# Project: SaaS Template

## App Structure
- **Public**: Landing page (`/`) — marketing, unauthenticated
- **Protected**: Dashboard (`/dashboard/**`) — authenticated users only
- Route protection via middleware (to be implemented)

## Tech Stack
- Next.js (App Router, RSC-first)
- TypeScript
- Tailwind CSS v4
- shadcn/ui (style: `base-nova`, baseColor: `neutral`)
- Lucide React (icons)

## Design System

### Principles
- Clean and minimal — less is more
- Dark theme by default; light theme supported
- Animations should feel purposeful, not decorative
- Generous whitespace, strong typographic hierarchy

### Typography
- **Headings**: Serif font (elegant, editorial)
- **Body / UI**: Sans-serif font (clean, readable)
- Apply via CSS variables `--font-heading` and `--font-sans`
- Use `font-heading` Tailwind class for all `h1`–`h3` elements
- Never mix more than two typefaces

### Colors
- Neutral palette (grays, off-whites, near-blacks)
- No saturated brand colors — use subtle tints if needed
- Dark theme is the primary experience
- All colors defined as CSS variables in `globals.css` via `oklch()`

### Spacing & Layout
- Consistent spacing scale via Tailwind
- Max content width: `max-w-6xl` centered
- Section padding: `py-24` on desktop, `py-16` on mobile
- Use CSS Grid and Flexbox — no absolute positioning hacks

### Animations
- Use Tailwind `animate-*` utilities where possible
- Use `tw-animate-css` for entrance animations
- Stagger reveals with `animation-delay` for lists and grids
- Hover states should be smooth (`transition-all duration-200`)
- Page load: fade + subtle translate-up on key elements
- No janky or excessive motion — respect `prefers-reduced-motion`

### Components
- Always use shadcn/ui primitives from `@/components/ui/`
- Compose new components on top of shadcn — don't rebuild from scratch
- Use `cn()` from `@/lib/utils` for all conditional class merging
- Components live in `src/components/`; UI primitives in `src/components/ui/`

## Code Rules
- **Never use inline styles** — always use Tailwind classes or CSS variables
- Prefer Server Components; add `"use client"` only when required (interactivity, hooks, browser APIs)
- Use named exports for components
- TypeScript strict mode — no `any`
- Import alias `@/` maps to `src/`

## After Every Code Change
- Run `npx tsc --noEmit` after writing or editing any TypeScript file
- Fix all type errors before considering the task complete
- This project uses `@base-ui/react` (not Radix) — key API differences:
  - `Button`: use `nativeButton={false} render={<a href="..." />}` instead of `asChild` (omitting `nativeButton={false}` causes a console warning)
  - `Accordion`: use `multiple={false}` instead of `type="single" collapsible`

## File Conventions
```
src/
  app/
    (public)/         # landing page routes
    (protected)/      # dashboard routes (auth-gated)
      dashboard/
  components/
    ui/               # shadcn primitives
    layout/           # Navbar, Footer, Sidebar, etc.
    sections/         # Landing page sections (Hero, Features, Pricing…)
  lib/
    utils.ts          # cn() and shared helpers
  hooks/              # custom React hooks
```

## Slash Commands
- `/new-component <Name>` — scaffold a new component
- `/new-page <route>` — scaffold a new App Router page
