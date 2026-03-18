"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useTRPC } from "@/trpc/client";

function getScoreColor(score: number): string {
  if (score <= 3.5) return "text-accent-red";
  if (score <= 6.5) return "text-accent-amber";
  return "text-accent-green";
}

function getCodeLines(code: string): string[] {
  return code.split("\n").slice(0, 3);
}

function isCommentLine(line: string): boolean {
  const trimmed = line.trimStart();
  return (
    trimmed.startsWith("//") ||
    trimmed.startsWith("--") ||
    trimmed.startsWith("#")
  );
}

export function LeaderboardPreview() {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(trpc.leaderboard.getTop3.queryOptions());

  return (
    <>
      {/* Table */}
      <div className="overflow-hidden border border-border-primary">
        {/* Table Header */}
        <div className="flex items-center bg-bg-surface px-5 py-3 border-b border-border-primary">
          <span className="w-[50px] shrink-0 font-mono text-xs font-medium text-text-tertiary">
            #
          </span>
          <span className="w-[70px] shrink-0 font-mono text-xs font-medium text-text-tertiary">
            score
          </span>
          <span className="flex-1 font-mono text-xs font-medium text-text-tertiary">
            code
          </span>
          <span className="w-[100px] shrink-0 font-mono text-xs font-medium text-text-tertiary">
            lang
          </span>
        </div>

        {/* Rows */}
        {data.entries.map((entry) => (
          <Link
            key={entry.id}
            href={`/roast/${entry.id}`}
            className="flex border-b border-border-primary px-5 py-4 last:border-b-0 transition-colors hover:bg-bg-elevated"
          >
            <span
              className={`w-[50px] shrink-0 font-mono text-xs ${entry.rank === 1 ? "text-accent-amber" : "text-text-secondary"}`}
            >
              {entry.rank}
            </span>
            <span
              className={`w-[70px] shrink-0 font-mono text-xs font-bold ${getScoreColor(entry.score)}`}
            >
              {entry.score.toFixed(1)}
            </span>
            <div className="flex flex-1 flex-col gap-0.5">
              {getCodeLines(entry.code).map((line, i) => (
                <span
                  // biome-ignore lint/suspicious/noArrayIndexKey: linha de código sem id único
                  key={i}
                  className={`font-mono text-xs ${isCommentLine(line) ? "text-text-tertiary" : "text-text-primary"}`}
                >
                  {line}
                </span>
              ))}
            </div>
            <span className="w-[100px] shrink-0 font-mono text-xs text-text-secondary">
              {entry.language}
            </span>
          </Link>
        ))}
      </div>

      {/* Footer Hint */}
      <p className="text-center font-mono text-xs text-text-tertiary">
        showing top 3 of {data.totalRoasts.toLocaleString("en-US")}
        {" · "}
        <Link
          href="/leaderboard"
          className="underline underline-offset-2 hover:text-text-secondary"
        >
          view full leaderboard &gt;&gt;
        </Link>
      </p>
    </>
  );
}
