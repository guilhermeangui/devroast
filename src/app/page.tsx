import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import { HomeStats } from "./components/home-stats";
import { ActionsBar, CodeEditor } from "./home-client";

const leaderboardData = [
  {
    rank: 1,
    score: 1.2,
    code: [
      'eval(prompt("enter code"))',
      "document.write(response)",
      "// trust the user lol",
    ],
    language: "javascript",
  },
  {
    rank: 2,
    score: 1.8,
    code: [
      "if (x == true) { return true; }",
      "else if (x == false) { return false; }",
      "else { return !false; }",
    ],
    language: "typescript",
  },
  {
    rank: 3,
    score: 2.1,
    code: ["SELECT * FROM users WHERE 1=1", "-- TODO: add authentication"],
    language: "sql",
  },
];

function getScoreColor(score: number): string {
  if (score <= 3.5) return "text-accent-red";
  if (score <= 6.5) return "text-accent-amber";
  return "text-accent-green";
}

export default function Home() {
  prefetch(trpc.stats.getStats.queryOptions());

  return (
    <HydrateClient>
      <main>
        {/* Hero + Code Editor */}
        <section className="mx-auto flex max-w-5xl flex-col items-center gap-8 px-10 pt-20">
          {/* Title */}
          <div className="flex flex-col items-center gap-3">
            <h1 className="flex items-center gap-3 font-mono text-4xl font-bold">
              <span className="text-accent-green">$</span>
              <span className="text-text-primary">
                paste your code. get roasted.
              </span>
            </h1>
            <p className="font-mono text-sm text-text-secondary">
              {
                "// drop your code below and we'll rate it — brutally honest or full roast mode"
              }
            </p>
          </div>

          {/* Code Editor */}
          <CodeEditor />

          {/* Actions Bar */}
          <ActionsBar />

          {/* Footer Stats */}
          <HomeStats />
        </section>

        {/* Leaderboard Preview */}
        <section className="mx-auto flex max-w-5xl flex-col gap-6 px-10 pt-16 pb-16">
          {/* Section Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-accent-green">
                {"//"}
              </span>
              <span className="font-mono text-sm font-bold text-text-primary">
                shame_leaderboard
              </span>
            </div>
            <Link href="/leaderboard">
              <Button variant="ghost" size="sm">
                {"$ view_all >>"}
              </Button>
            </Link>
          </div>

          <p className="font-mono text-[13px] text-text-tertiary">
            {"// the worst code on the internet, ranked by shame"}
          </p>

          {/* Table */}
          <div className="overflow-hidden border border-border-primary">
            {/* Table Header */}
            <div className="flex items-center bg-bg-surface px-5 py-3">
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
            {leaderboardData.map((row) => (
              <div
                key={row.rank}
                className="flex border-t border-border-primary px-5 py-4"
              >
                <span
                  className={`w-[50px] shrink-0 font-mono text-xs ${row.rank === 1 ? "text-accent-amber" : "text-text-secondary"}`}
                >
                  {row.rank}
                </span>
                <span
                  className={`w-[70px] shrink-0 font-mono text-xs font-bold ${getScoreColor(row.score)}`}
                >
                  {row.score}
                </span>
                <div className="flex flex-1 flex-col gap-0.5">
                  {row.code.map((line) => (
                    <span
                      key={line}
                      className={`font-mono text-xs ${line.startsWith("//") || line.startsWith("--") ? "text-text-tertiary" : "text-text-primary"}`}
                    >
                      {line}
                    </span>
                  ))}
                </div>
                <span className="w-[100px] shrink-0 font-mono text-xs text-text-secondary">
                  {row.language}
                </span>
              </div>
            ))}
          </div>

          {/* Fade Hint */}
          <p className="text-center font-mono text-xs text-text-tertiary">
            {"showing top 3 of 2,847 · view full leaderboard >>"}
          </p>
        </section>
      </main>
    </HydrateClient>
  );
}
