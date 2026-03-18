import type { BundledLanguage } from "shiki";
import { codeToHtml } from "shiki";
import { caller } from "@/trpc/server";

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

function getScoreColor(score: number): string {
  if (score <= 3.5) return "text-accent-red";
  if (score <= 6.5) return "text-accent-amber";
  return "text-accent-green";
}

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
      {rows.map((entry) => {
        const lines = entry.code.split("\n");
        return (
          <div
            key={entry.id}
            className="overflow-hidden border border-border-primary"
          >
            {/* Meta Row */}
            <div className="flex h-12 items-center justify-between border-b border-border-primary px-5">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs text-text-tertiary">
                    #
                  </span>
                  <span className="font-mono text-sm font-bold text-accent-amber">
                    {entry.rank}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs text-text-tertiary">
                    score
                  </span>
                  <span
                    className={`font-mono text-sm font-bold ${getScoreColor(entry.score)}`}
                  >
                    {entry.score.toFixed(1)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-text-secondary">
                  {entry.language}
                </span>
                <span className="font-mono text-xs text-text-tertiary">
                  {lines.length} {lines.length === 1 ? "line" : "lines"}
                </span>
              </div>
            </div>

            {/* Code Block */}
            <div className="flex h-[120px] overflow-hidden bg-bg-input">
              {/* Line Numbers */}
              <div className="flex w-10 shrink-0 flex-col items-end gap-1.5 border-r border-border-primary bg-bg-surface px-2.5 py-3.5">
                {Array.from({ length: lines.length }, (_, i) => i + 1).map(
                  (n) => (
                    <span
                      key={n}
                      className="font-mono text-xs leading-tight text-text-tertiary"
                    >
                      {n}
                    </span>
                  ),
                )}
              </div>

              {/* Code Content */}
              <div
                className="flex-1 overflow-hidden p-3.5 pl-4 font-mono text-xs leading-relaxed [&>pre]:!bg-transparent [&_code]:font-mono [&_code_.line]:block [&_code_.line]:leading-tight"
                // biome-ignore lint/security/noDangerouslySetInnerHtml: HTML gerado pelo Shiki no servidor, seguro
                dangerouslySetInnerHTML={{ __html: entry.highlightedHtml }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
