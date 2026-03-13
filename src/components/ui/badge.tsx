import type { ComponentProps } from "react";
import { tv, type VariantProps } from "tailwind-variants";

const badge = tv({
  slots: {
    root: "inline-flex items-center gap-2",
    dot: "size-2 rounded-full",
    label: "font-mono text-xs",
  },
  variants: {
    variant: {
      critical: {
        dot: "bg-accent-red",
        label: "text-accent-red",
      },
      warning: {
        dot: "bg-accent-amber",
        label: "text-accent-amber",
      },
      good: {
        dot: "bg-accent-green",
        label: "text-accent-green",
      },
      info: {
        dot: "bg-accent-cyan",
        label: "text-accent-cyan",
      },
    },
  },
  defaultVariants: {
    variant: "good",
  },
});

type BadgeVariants = VariantProps<typeof badge>;

type BadgeProps = ComponentProps<"span"> &
  BadgeVariants & {
    children: string;
  };

function Badge({ variant, className, children, ...props }: BadgeProps) {
  const { root, dot, label } = badge({ variant });

  return (
    <span className={root({ className })} {...props}>
      <span className={dot()} />
      <span className={label()}>{children}</span>
    </span>
  );
}

export { Badge, badge, type BadgeProps, type BadgeVariants };
