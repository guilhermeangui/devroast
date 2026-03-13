"use client";

import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";

const placeholderCode = `function calculateTotal(items) {
  var total = 0;
  for (var i = 0; i < items.length; i++) {
    total = total + items[i].price;
  }

  if (total > 100) {
    console.log("discount applied");
    total = total * 0.9;
  }

  // TODO: handle tax calculation
  // TODO: handle currency conversion

  return total;
}`;

function CodeEditor() {
  return (
    <div className="w-full max-w-[780px] overflow-hidden border border-border-primary bg-bg-input">
      <div className="flex h-10 items-center gap-2 border-b border-border-primary px-4">
        <span className="size-3 rounded-full bg-accent-red" />
        <span className="size-3 rounded-full bg-accent-amber" />
        <span className="size-3 rounded-full bg-accent-green" />
      </div>
      <textarea
        className="h-[320px] w-full resize-none bg-transparent p-4 font-mono text-xs leading-relaxed text-text-primary outline-none placeholder:text-text-tertiary"
        placeholder="// paste your code here..."
        defaultValue={placeholderCode}
        spellCheck={false}
      />
    </div>
  );
}

function ActionsBar() {
  return (
    <div className="flex w-full max-w-[780px] items-center justify-between">
      <div className="flex items-center gap-4">
        <Toggle label="roast mode" defaultChecked />
        <span className="font-mono text-xs text-text-tertiary">
          {"// maximum sarcasm enabled"}
        </span>
      </div>
      <Button variant="primary" size="lg">
        $ roast_my_code
      </Button>
    </div>
  );
}

export { CodeEditor, ActionsBar };
