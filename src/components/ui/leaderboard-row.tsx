import type { ComponentProps } from "react";
import { tv } from "tailwind-variants";

function getScoreColor(score: number): string {
  if (score <= 3.5) return "text-accent-red";
  if (score <= 6.5) return "text-accent-amber";
  return "text-accent-green";
}

const leaderboardRow = tv({
  base: "flex items-center gap-6 border-b border-border-primary px-5 py-4",
});

type LeaderboardRowProps = ComponentProps<"div"> & {
  rank: number;
  score: number;
  codePreview: string;
  language: string;
};

function LeaderboardRow({
  rank,
  score,
  codePreview,
  language,
  className,
  ...props
}: LeaderboardRowProps) {
  return (
    <div className={leaderboardRow({ className })} {...props}>
      <span className="w-10 shrink-0 font-mono text-[13px] text-text-tertiary">
        #{rank}
      </span>
      <span
        className={`w-15 shrink-0 font-mono text-[13px] font-bold ${getScoreColor(score)}`}
      >
        {score}
      </span>
      <span className="min-w-0 flex-1 truncate font-mono text-xs text-text-secondary">
        {codePreview}
      </span>
      <span className="w-25 shrink-0 text-right font-mono text-xs text-text-tertiary">
        {language}
      </span>
    </div>
  );
}

export { LeaderboardRow, leaderboardRow, type LeaderboardRowProps };
