import type { BundledLanguage } from "shiki";
import { codeToHtml } from "shiki";

type CodeBlockProps = {
  code: string;
  lang?: BundledLanguage;
  filename?: string;
};

async function CodeBlock({
  code,
  lang = "typescript",
  filename,
}: CodeBlockProps) {
  const html = await codeToHtml(code, {
    lang,
    theme: "vesper",
  });

  return (
    <div className="overflow-hidden border border-border-primary bg-bg-input">
      {filename && (
        <div className="flex h-10 items-center gap-3 border-b border-border-primary px-4">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-accent-red" />
            <span className="size-2.5 rounded-full bg-accent-amber" />
            <span className="size-2.5 rounded-full bg-accent-green" />
          </div>
          <div className="flex-1" />
          <span className="font-mono text-xs text-text-tertiary">
            {filename}
          </span>
        </div>
      )}
      <div
        className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed [&>pre]:!bg-transparent [&_code]:font-mono"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}

export { CodeBlock, type CodeBlockProps };
