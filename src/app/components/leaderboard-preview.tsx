import { cacheLife } from "next/cache";
import Link from "next/link";
import type { BundledLanguage } from "shiki";
import { codeToHtml } from "shiki";
import { caller } from "@/trpc/server";
import { LeaderboardRow } from "./leaderboard-row";

// Mapeia os valores do enum do banco para os identificadores do Shiki
const SHIKI_LANG: Record<string, BundledLanguage> = {
  javascript: "javascript",
  typescript: "typescript",
  python: "python",
  rust: "rust",
  go: "go",
  java: "java",
  c: "c",
  cpp: "cpp",
  csharp: "csharp",
  php: "php",
  ruby: "ruby",
  swift: "swift",
  kotlin: "kotlin",
  sql: "sql",
  shell: "bash",
  other: "typescript", // fallback razoável
};

export async function LeaderboardPreview() {
  "use cache";
  cacheLife("hours");

  const { entries, totalRoasts } = await caller.leaderboard.getTop3();

  const rows = await Promise.all(
    entries.map(async (entry) => {
      const lang = SHIKI_LANG[entry.language] ?? "typescript";
      const highlightedHtml = await codeToHtml(entry.code, {
        lang,
        theme: "vesper",
      });
      return { ...entry, highlightedHtml };
    }),
  );

  return (
    <>
      {/* Table */}
      <div className="overflow-hidden border border-border-primary">
        {/* Table Header */}
        <div className="flex items-center border-b border-border-primary bg-bg-surface px-5 py-3">
          <span className="w-[50px] shrink-0 font-mono text-xs font-medium text-text-tertiary">
            #
          </span>
          <span className="w-[70px] shrink-0 font-mono text-xs font-medium text-text-tertiary">
            score
          </span>
          <span className="flex-1 font-mono text-xs font-medium text-text-tertiary">
            code
          </span>
          <span className="w-[100px] shrink-0 pl-4 font-mono text-xs font-medium text-text-tertiary">
            lang
          </span>
        </div>

        {/* Rows */}
        {rows.map((row) => (
          <LeaderboardRow
            key={row.id}
            id={row.id}
            rank={row.rank}
            score={row.score}
            language={row.language}
            lineCount={row.lineCount}
            highlightedHtml={row.highlightedHtml}
          />
        ))}
      </div>

      {/* Footer Hint */}
      <p className="text-center font-mono text-xs text-text-tertiary">
        showing top 3 of {totalRoasts.toLocaleString("en-US")}
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
