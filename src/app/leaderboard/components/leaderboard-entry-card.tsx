"use client";

import { useState } from "react";

type LeaderboardEntryCardProps = {
  id: string;
  rank: number;
  score: number;
  language: string;
  lineCount: number;
  highlightedHtml: string;
};

function getScoreColor(score: number): string {
  if (score <= 3.5) return "text-accent-red";
  if (score <= 6.5) return "text-accent-amber";
  return "text-accent-green";
}

const LINE_HEIGHT_PX = 20; // deve bater com [&_code_.line]:leading-5 (1.25rem = 20px)
const CODE_PADDING_Y_PX = 14; // py-3.5 = 14px
// Altura suficiente para caber até 5 linhas (5 × 20 + 28 = 128) sem colapso desnecessário.
// Colapso só aparece quando expandedHeight > COLLAPSED_HEIGHT, ou seja, a partir de 6 linhas.
const COLLAPSED_HEIGHT = 130;

function computeExpandedHeight(lineCount: number): number {
  return lineCount * LINE_HEIGHT_PX + CODE_PADDING_Y_PX * 2;
}

export function LeaderboardEntryCard({
  rank,
  score,
  language,
  lineCount,
  highlightedHtml,
}: LeaderboardEntryCardProps) {
  const expandedHeight = computeExpandedHeight(lineCount);
  const needsCollapsible = expandedHeight > COLLAPSED_HEIGHT;
  const [expanded, setExpanded] = useState(false);

  const collapsedHeight = COLLAPSED_HEIGHT;
  const currentHeight =
    needsCollapsible && !expanded ? collapsedHeight : expandedHeight;

  return (
    <div className="overflow-hidden border border-border-primary">
      {/* Meta Row */}
      <div className="flex h-12 items-center justify-between border-b border-border-primary px-5">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs text-text-tertiary">#</span>
            <span className="font-mono text-sm font-bold text-accent-amber">
              {rank}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs text-text-tertiary">score</span>
            <span
              className={`font-mono text-sm font-bold ${getScoreColor(score)}`}
            >
              {score.toFixed(1)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-text-secondary">
            {language}
          </span>
          <span className="font-mono text-xs text-text-tertiary">
            {lineCount} {lineCount === 1 ? "line" : "lines"}
          </span>
        </div>
      </div>

      {/* Code Block */}
      <div
        className="flex overflow-hidden bg-bg-input transition-[height] duration-300 ease-in-out"
        style={{ height: `${currentHeight}px` }}
      >
        {/* Line Numbers */}
        <div className="flex w-10 shrink-0 flex-col border-r border-border-primary bg-bg-surface px-2.5 py-3.5">
          {Array.from({ length: lineCount }, (_, i) => i + 1).map((n) => (
            <span
              key={n}
              className="text-right font-mono text-xs leading-5 text-text-tertiary"
            >
              {n}
            </span>
          ))}
        </div>

        {/* Code Content */}
        <div
          className="flex-1 overflow-hidden py-3.5 pl-4 pr-3.5 font-mono text-xs [&>pre]:!bg-transparent [&>pre]:leading-[0] [&_code]:block [&_code]:font-mono [&_code]:leading-[0] [&_code_.line]:block [&_code_.line]:leading-5"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: HTML gerado pelo Shiki no servidor, seguro
          dangerouslySetInnerHTML={{ __html: highlightedHtml }}
        />
      </div>

      {/* Expand / Collapse trigger */}
      {needsCollapsible && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-center justify-center gap-1.5 border-t border-border-primary bg-bg-surface py-2 font-mono text-[11px] text-text-tertiary transition-colors hover:bg-bg-elevated hover:text-text-secondary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border-focus"
        >
          <ChevronIcon
            className={`size-2.5 transition-transform duration-200 ${expanded ? "-rotate-90" : "rotate-90"}`}
          />
          {expanded ? "collapse" : `show all ${lineCount} lines`}
        </button>
      )}
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
