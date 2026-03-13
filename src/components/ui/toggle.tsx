"use client";

import { Switch } from "@base-ui/react/switch";
import type { ComponentProps } from "react";
import { tv } from "tailwind-variants";

const toggle = tv({
  slots: {
    root: [
      "flex items-center gap-3",
      "cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
    ],
    track: [
      "relative flex h-[22px] w-10 items-center rounded-full p-[3px]",
      "transition-colors duration-200",
      "bg-border-primary data-[checked]:bg-accent-green",
    ],
    thumb: [
      "size-4 rounded-full transition-transform duration-200",
      "bg-text-secondary data-[checked]:bg-bg-page",
      "data-[checked]:translate-x-[18px]",
    ],
    label:
      "font-mono text-xs text-text-secondary data-[checked]:text-accent-green",
  },
});

type ToggleProps = Omit<ComponentProps<typeof Switch.Root>, "className"> & {
  label?: string;
  className?: string;
};

const { root, track, thumb, label } = toggle();

function Toggle({ label: labelText, className, ...props }: ToggleProps) {
  return (
    <div className={root({ className })}>
      <Switch.Root aria-label={labelText} className={track()} {...props}>
        <Switch.Thumb className={thumb()} />
      </Switch.Root>
      {labelText && <span className={label()}>{labelText}</span>}
    </div>
  );
}

export { Toggle, toggle, type ToggleProps };
