"use client";

import { Button } from "@/components/ui/button";
import { CodeEditor } from "@/components/ui/code-editor";
import { Toggle } from "@/components/ui/toggle";

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
