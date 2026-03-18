import type { BundledLanguage } from "shiki";
import { codeToHtml } from "shiki";
import { caller } from "@/trpc/server";
import { LeaderboardEntryCard } from "./leaderboard-entry-card";

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
  other: "typescript",
};

export async function LeaderboardEntries() {
  const { entries } = await caller.leaderboard.getTop20();

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
    <div className="flex flex-col gap-5">
      {rows.map((entry) => (
        <LeaderboardEntryCard
          key={entry.id}
          id={entry.id}
          rank={entry.rank}
          score={entry.score}
          language={entry.language}
          lineCount={entry.lineCount}
          highlightedHtml={entry.highlightedHtml}
        />
      ))}
    </div>
  );
}
