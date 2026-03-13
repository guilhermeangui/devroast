# UI Component Patterns

Rules and conventions for creating components inside `src/components/ui/`.

## Exports

- Always use **named exports**. Never use `export default`.
- Export the component function, the `tv()` recipe, and the TypeScript types.

```tsx
export { Button, button, type ButtonProps, type ButtonVariants };
```

## TypeScript

- Extend native HTML element props using `ComponentProps<"element">` from React.
- Intersect with `VariantProps<typeof recipe>` for variant typing.
- Do NOT redeclare `className` manually — it is already included in `ComponentProps`.

```tsx
import type { ComponentProps } from "react";
import { tv, type VariantProps } from "tailwind-variants";

type ButtonVariants = VariantProps<typeof button>;
type ButtonProps = ComponentProps<"button"> & ButtonVariants;
```

## Styling with tailwind-variants

- Define styles using `tv()` from `tailwind-variants`.
- Pass `className` directly to the `tv()` call — it handles merging internally via `tailwind-merge`. Do NOT import or use `twMerge` manually.

```tsx
function Button({ variant, size, className, ...props }: ButtonProps) {
  return (
    <button
      className={button({ variant, size, className })}
      {...props}
    />
  );
}
```

## Design Tokens

- Never hardcode hex colors in classes (e.g. `bg-[#0a1a0f]`) or inline styles (e.g. `stroke="#2A2A2A"`).
- Always use Tailwind tokens defined in `globals.css` via `@theme inline`.
- For Tailwind classes: use the generated utilities (e.g. `bg-accent-green`, `border-border-primary`, `text-text-primary`).
- For SVG inline attributes (e.g. `stroke`, `fill`): use `var(--color-*)` to reference the same tokens (e.g. `stroke="var(--color-border-primary)"`).

### Available tokens

| Category    | Tokens                                                       |
| ----------- | ------------------------------------------------------------ |
| Backgrounds | `bg-page`, `bg-surface`, `bg-elevated`, `bg-input`           |
| Borders     | `border-primary`, `border-secondary`, `border-focus`          |
| Text        | `text-primary`, `text-secondary`, `text-tertiary`             |
| Accents     | `accent-green`, `accent-red`, `accent-amber`, `accent-cyan`  |
| Diff        | `diff-added`, `diff-removed`                                  |
| Semantic    | `danger`, `success`, `warning`, `info`                        |

Usage: `bg-bg-page`, `text-text-primary`, `border-border-primary`, `bg-accent-green`, `bg-diff-added`, etc.
For SVG: `var(--color-accent-red)`, `var(--color-border-primary)`, etc.

## Fonts

- Use Tailwind's default font-family utilities: `font-sans` and `font-mono`.
- `font-sans` — system font stack (default for body text, labels, UI).
- `font-mono` — JetBrains Mono (for code, terminal-style text, monospaced elements).
- Do NOT use custom font classes like `font-primary` or `font-secondary`.
- Do NOT hardcode `fontFamily` values. Always use the Tailwind utilities.

## Component Structure

- Use `function` declarations (not arrow functions) for components.
- Destructure `variant`, `size`, `className`, and spread `...props`.
- Apply `className` through the `tv()` call, never concatenate strings.

```tsx
const recipe = tv({
  base: [...],
  variants: { ... },
  defaultVariants: { ... },
});

type Variants = VariantProps<typeof recipe>;
type Props = ComponentProps<"element"> & Variants;

function Component({ variant, size, className, ...props }: Props) {
  return (
    <element className={recipe({ variant, size, className })} {...props} />
  );
}

export { Component, recipe, type Props, type Variants };
```
