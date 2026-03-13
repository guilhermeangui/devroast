import type { ComponentProps } from "react";
import { tv, type VariantProps } from "tailwind-variants";

const diffLine = tv({
  slots: {
    root: "flex gap-2 px-4 py-2 font-mono text-[13px]",
    prefix: "shrink-0 select-none",
    code: "",
  },
  variants: {
    type: {
      added: {
        root: "bg-diff-added",
        prefix: "text-accent-green",
        code: "text-text-primary",
      },
      removed: {
        root: "bg-diff-removed",
        prefix: "text-accent-red",
        code: "text-text-secondary",
      },
      context: {
        root: "",
        prefix: "text-text-tertiary",
        code: "text-text-secondary",
      },
    },
  },
  defaultVariants: {
    type: "context",
  },
});

type DiffLineVariants = VariantProps<typeof diffLine>;

type DiffLineProps = ComponentProps<"div"> &
  DiffLineVariants & {
    children: string;
  };

const prefixMap = {
  added: "+",
  removed: "-",
  context: " ",
} as const;

function DiffLine({
  type = "context",
  className,
  children,
  ...props
}: DiffLineProps) {
  const { root, prefix, code } = diffLine({ type });

  return (
    <div className={root({ className })} {...props}>
      <span className={prefix()}>{prefixMap[type ?? "context"]}</span>
      <span className={code()}>{children}</span>
    </div>
  );
}

export { DiffLine, diffLine, type DiffLineProps, type DiffLineVariants };
