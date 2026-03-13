# DevRoast

AI-powered code roasting app. Users paste code, get brutally honest reviews with scores.

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 (`@theme inline` for design tokens)
- **Components:** tailwind-variants for variant styling, @base-ui/react for headless primitives
- **Syntax Highlighting:** shiki (server-side, vesper theme)
- **Linting/Formatting:** Biome (2 spaces, tailwindDirectives enabled)
- **Package Manager:** pnpm

## Project Structure

```
src/
  app/              # Next.js App Router pages and layouts
  components/
    ui/             # Reusable UI primitives (Button, Badge, Toggle, etc.)
```

## Key Conventions

- **Named exports only** — never use `export default` in components (pages use default as required by Next.js).
- **Design tokens** — all colors come from `globals.css` `@theme inline`. Never hardcode hex values in components. For SVG inline attributes, use `var(--color-*)`.
- **Fonts** — `font-sans` (system stack) for UI text, `font-mono` (JetBrains Mono) for code/terminal text.
- **Component styling** — use `tv()` from tailwind-variants. Pass `className` directly to the `tv()` call for merging. Do not use `twMerge` manually.
- **TypeScript** — extend native HTML props via `ComponentProps<"element">` intersected with `VariantProps`.
- **Biome** — run `pnpm lint` to check, `pnpm format` to auto-format.

## Component Patterns

See `src/components/ui/AGENTS.md` for detailed UI component conventions.
