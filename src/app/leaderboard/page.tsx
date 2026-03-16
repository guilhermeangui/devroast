import type { BundledLanguage } from "shiki";
import { codeToHtml } from "shiki";

const leaderboardEntries = [
  {
    rank: 1,
    score: 1.2,
    language: "javascript",
    code: 'eval(prompt("enter code"))\ndocument.write(response)\n// trust the user lol',
  },
  {
    rank: 2,
    score: 1.8,
    language: "typescript",
    code: "if (x == true) { return true; }\nelse if (x == false) { return false; }\nelse { return !false; }",
  },
  {
    rank: 3,
    score: 2.1,
    language: "sql",
    code: "SELECT * FROM users WHERE 1=1\n-- TODO: add authentication",
  },
  {
    rank: 4,
    score: 2.3,
    language: "java",
    code: "catch (e) {\n  // ignore\n}",
  },
  {
    rank: 5,
    score: 2.5,
    language: "javascript",
    code: "const sleep = (ms) =>\n  new Date(Date.now() + ms)\n  while(new Date() < end) {}",
  },
];

function getScoreColor(score: number): string {
  if (score <= 3.5) return "text-accent-red";
  if (score <= 6.5) return "text-accent-amber";
  return "text-accent-green";
}

async function LeaderboardEntry({
  rank,
  score,
  language,
  code,
}: {
  rank: number;
  score: number;
  language: string;
  code: string;
}) {
  const lines = code.split("\n");
  const html = await codeToHtml(code, {
    lang: language as BundledLanguage,
    theme: "vesper",
  });

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
              {score}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-text-secondary">
            {language}
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
          {lines.map((line, i) => (
            <span
              key={`${line}-${i.toString()}`}
              className="font-mono text-xs leading-tight text-text-tertiary"
            >
              {i + 1}
            </span>
          ))}
        </div>

        {/* Code Content */}
        <div
          className="flex-1 overflow-hidden p-3.5 pl-4 font-mono text-xs leading-relaxed [&>pre]:!bg-transparent [&_code]:font-mono [&_code_.line]:block [&_code_.line]:leading-tight"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
}

export default async function LeaderboardPage() {
  return (
    <main className="mx-auto max-w-5xl px-20 py-10">
      <div className="flex flex-col gap-10">
        {/* Hero Section */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[32px] font-bold text-accent-green">
              {">"}
            </span>
            <span className="font-mono text-[28px] font-bold text-text-primary">
              shame_leaderboard
            </span>
          </div>

          <p className="text-sm text-text-secondary">
            {"// the most roasted code on the internet"}
          </p>

          <div className="flex items-center gap-2 font-mono text-xs text-text-tertiary">
            <span>2,847 submissions</span>
            <span>·</span>
            <span>avg score: 4.2/10</span>
          </div>
        </section>

        {/* Leaderboard Entries */}
        <section className="flex flex-col gap-5">
          {leaderboardEntries.map((entry) => (
            <LeaderboardEntry
              key={entry.rank}
              rank={entry.rank}
              score={entry.score}
              language={entry.language}
              code={entry.code}
            />
          ))}
        </section>
      </div>
    </main>
  );
}
