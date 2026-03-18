import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { BundledLanguage } from "shiki";
import { codeToHtml } from "shiki";

import { Badge } from "@/components/ui/badge";
import { ScoreRing } from "@/components/ui/score-ring";
import { caller } from "@/trpc/server";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: "Roast Result | devroast",
    description: `AI-powered code review result for roast ${id}. See your score, detailed analysis and suggested fixes.`,
  };
}

function getVerdictVariant(
  score: number,
): "critical" | "warning" | "good" | "info" {
  if (score <= 3.5) return "critical";
  if (score <= 6.5) return "warning";
  return "good";
}

export default async function RoastResultPage({ params }: Props) {
  const { id } = await params;

  const data = await caller.roast.getById({ id });
  if (!data) notFound();

  const score = Number(data.score);
  const verdictVariant = getVerdictVariant(score);
  const codeLines = data.code.split("\n");

  const codeHtml = await codeToHtml(data.code, {
    lang: (data.language as BundledLanguage) ?? "text",
    theme: "vesper",
  });

  return (
    <main className="mx-auto max-w-5xl px-20 py-10">
      <div className="flex flex-col gap-10">
        {/* Score Hero */}
        <section className="flex items-center gap-12">
          <ScoreRing score={score} />

          <div className="flex flex-1 flex-col gap-4">
            <Badge variant={verdictVariant}>{`verdict: ${data.verdict}`}</Badge>

            <p className="font-mono text-xl leading-[1.5] text-text-primary">
              {data.roastQuote}
            </p>

            <div className="flex items-center gap-4 font-mono text-xs text-text-tertiary">
              <span>lang: {data.language}</span>
              <span>·</span>
              <span>{data.lineCount} lines</span>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="h-px bg-border-primary" />

        {/* Submitted Code */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-accent-green">
              {"//"}
            </span>
            <span className="font-mono text-sm font-bold text-text-primary">
              your_submission
            </span>
          </div>

          <div className="overflow-hidden border border-border-primary bg-bg-input">
            <div className="flex">
              {/* Line Numbers */}
              <div className="flex w-12 shrink-0 flex-col items-end gap-2 border-r border-border-primary bg-bg-surface px-3 py-4">
                {Array.from({ length: codeLines.length }, (_, i) => i + 1).map(
                  (n) => (
                    <span
                      key={n}
                      className="font-mono text-xs text-text-tertiary"
                    >
                      {n}
                    </span>
                  ),
                )}
              </div>

              {/* Code with Shiki highlight */}
              <div
                className="flex-1 overflow-hidden p-4 font-mono text-xs [&>pre]:!bg-transparent [&_code]:font-mono [&_code_.line]:block [&_code_.line]:leading-loose"
                dangerouslySetInnerHTML={{ __html: codeHtml }}
              />
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="h-px bg-border-primary" />

        {/* Detailed Analysis */}
        <section className="flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-accent-green">
              {"//"}
            </span>
            <span className="font-mono text-sm font-bold text-text-primary">
              detailed_analysis
            </span>
          </div>

          <div className="grid grid-cols-2 gap-5">
            {(
              data.issues as Array<{
                severity: "critical" | "warning" | "good";
                title: string;
                description: string;
              }>
            ).map((issue) => (
              <div
                key={issue.title}
                className="flex flex-col gap-3 border border-border-primary p-5"
              >
                <Badge variant={issue.severity}>{issue.severity}</Badge>
                <span className="font-mono text-[13px] font-medium text-text-primary">
                  {issue.title}
                </span>
                <p className="font-mono text-xs leading-relaxed text-text-secondary">
                  {issue.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Suggested Fix — only if present */}
        {data.suggestedFix && (
          <>
            {/* Divider */}
            <div className="h-px bg-border-primary" />

            <section className="flex flex-col gap-6">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-accent-green">
                  {"//"}
                </span>
                <span className="font-mono text-sm font-bold text-text-primary">
                  suggested_fix
                </span>
              </div>

              <div className="overflow-hidden border border-border-primary bg-bg-input">
                <pre className="p-4 font-mono text-xs leading-relaxed text-text-primary whitespace-pre-wrap">
                  {data.suggestedFix}
                </pre>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
