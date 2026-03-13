import type { ComponentProps } from "react";
import { tv, type VariantProps } from "tailwind-variants";

const button = tv({
  base: [
    "inline-flex items-center justify-center gap-2",
    "font-mono font-medium",
    "transition-colors duration-200",
    "cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
  ],
  variants: {
    variant: {
      primary: "bg-accent-green text-bg-page hover:bg-accent-green/80",
      secondary:
        "border border-border-primary text-text-primary hover:bg-bg-elevated hover:text-text-primary",
      ghost:
        "border border-border-primary text-text-secondary hover:text-text-primary hover:border-border-focus",
    },
    size: {
      sm: "px-3 py-1.5 text-xs",
      md: "px-4 py-2 text-sm",
      lg: "px-6 py-2.5 text-sm",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "md",
  },
});

type ButtonVariants = VariantProps<typeof button>;

type ButtonProps = ComponentProps<"button"> & ButtonVariants;

function Button({ variant, size, className, ...props }: ButtonProps) {
  return <button className={button({ variant, size, className })} {...props} />;
}

export { Button, button, type ButtonProps, type ButtonVariants };
