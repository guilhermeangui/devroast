"use client";

import Link from "next/link";
import { useState } from "react";

type LeaderboardRowProps = {
  id: string;
  rank: number;
  score: number;
  language: string;
  highlightedHtml: string;
  lineCount: number;
};

function getScoreColor(score: number): string {
  if (score <= 3.5) return "text-accent-red";
  if (score <= 6.5) return "text-accent-amber";
  return "text-accent-green";
}

const COLLAPSE_THRESHOLD = 4; // linhas — abaixo disso não mostra o trigger

export function LeaderboardRow({
  id,
  rank,
  score,
  language,
  highlightedHtml,
  lineCount,
}: LeaderboardRowProps) {
  const needsCollapsible = lineCount > COLLAPSE_THRESHOLD;
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b border-border-primary last:border-b-0">
      <div className="flex px-5 py-4 transition-colors hover:bg-bg-elevated">
        {/* Rank */}
        <span
          className={`w-[50px] shrink-0 pt-0.5 font-mono text-xs ${rank === 1 ? "text-accent-amber" : "text-text-secondary"}`}
        >
          {rank}
        </span>

        {/* Score */}
        <span
          className={`w-[70px] shrink-0 pt-0.5 font-mono text-xs font-bold ${getScoreColor(score)}`}
        >
          {score.toFixed(1)}
        </span>

        {/* Code + trigger */}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {/* Code block — sempre visível no SSR; altura clampada via overflow */}
          <div
            className={[
              "overflow-hidden transition-[max-height] duration-300 ease-in-out",
              needsCollapsible && !expanded ? "max-h-24" : "max-h-[9999px]",
            ].join(" ")}
          >
            <div
              className="font-mono text-[13px] leading-relaxed [&>pre]:!bg-transparent [&_code]:font-mono"
              // biome-ignore lint/security/noDangerouslySetInnerHtml: HTML gerado pelo Shiki no servidor, seguro
              dangerouslySetInnerHTML={{ __html: highlightedHtml }}
            />
          </div>

          {/* Trigger */}
          {needsCollapsible && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="flex w-fit items-center gap-1.5 font-mono text-[11px] text-text-tertiary transition-colors hover:text-text-secondary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border-focus"
            >
              <ChevronIcon
                className={`size-2.5 transition-transform duration-200 ${expanded ? "rotate-90" : ""}`}
              />
              {expanded ? "collapse" : `show all ${lineCount} lines`}
            </button>
          )}
        </div>

        {/* Lang + link */}
        <div className="flex w-[100px] shrink-0 flex-col items-start gap-2 pl-4">
          <span className="font-mono text-xs text-text-secondary">
            {language}
          </span>
          <Link
            href={`/roast/${id}`}
            className="font-mono text-[11px] text-text-tertiary underline underline-offset-2 transition-colors hover:text-text-secondary"
          >
            view roast
          </Link>
        </div>
      </div>
    </div>
  );
}

function ChevronIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      aria-hidden="true"
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      {...props}
    >
      <path d="M3.5 9L7.5 5L3.5 1" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
