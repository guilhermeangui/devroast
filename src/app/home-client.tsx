"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CodeEditor } from "@/components/ui/code-editor";
import { Toggle } from "@/components/ui/toggle";
import { useTRPC } from "@/trpc/client";

function SubmitForm() {
  const router = useRouter();
  const trpc = useTRPC();

  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [roastMode, setRoastMode] = useState(false);

  const { mutate, isPending, error } = useMutation(
    trpc.roast.submit.mutationOptions({
      onSuccess: (data) => {
        router.push(`/roast/${data.id}`);
      },
    }),
  );

  function handleSubmit() {
    if (!code.trim()) return;
    mutate({ code, language, roastMode });
  }

  return (
    <>
      <CodeEditor
        onChange={(newCode, newLang) => {
          setCode(newCode);
          setLanguage(newLang);
        }}
      />

      <div className="flex w-full max-w-[780px] items-center justify-between">
        <div className="flex items-center gap-4">
          <Toggle
            label="roast mode"
            checked={roastMode}
            onCheckedChange={setRoastMode}
          />
          <span className="font-mono text-xs text-text-tertiary">
            {"// maximum sarcasm enabled"}
          </span>
        </div>
        <Button
          variant="primary"
          size="lg"
          onClick={handleSubmit}
          disabled={isPending}
        >
          {isPending ? "$ roasting..." : "$ roast_my_code"}
        </Button>
      </div>

      {error && (
        <p className="font-mono text-xs text-accent-red">
          {`// error: ${error.message}`}
        </p>
      )}
    </>
  );
}

export { SubmitForm };
