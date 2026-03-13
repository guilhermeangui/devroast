"use client";

import { Toggle } from "@/components/ui/toggle";

function ToggleShowcase() {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="font-mono text-xs uppercase tracking-wider text-text-tertiary">
        States
      </h3>
      <div className="flex items-center gap-8">
        <Toggle label="roast mode" defaultChecked />
        <Toggle label="roast mode" />
      </div>
    </div>
  );
}

export { ToggleShowcase };
