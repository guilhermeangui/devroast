import type { ComponentProps } from "react";

type ScoreRingProps = ComponentProps<"div"> & {
  score: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
};

function getScoreColor(score: number, max: number): string {
  const ratio = score / max;
  if (ratio <= 0.35) return "var(--color-accent-red)";
  if (ratio <= 0.65) return "var(--color-accent-amber)";
  return "var(--color-accent-green)";
}

function ScoreRing({
  score,
  max = 10,
  size = 180,
  strokeWidth = 4,
  className,
  ...props
}: ScoreRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = Math.min(score / max, 1);
  const filledLength = circumference * ratio;
  const gapLength = circumference - filledLength;
  const color = getScoreColor(score, max);

  return (
    <div
      className={className}
      style={{ width: size, height: size, position: "relative" }}
      {...props}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="block -rotate-90"
        role="img"
        aria-label={`Score: ${score} out of ${max}`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-border-primary)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${filledLength} ${gapLength}`}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
        <span className="font-mono text-5xl font-bold text-text-primary">
          {score}
        </span>
        <span className="font-mono text-base text-text-tertiary">/{max}</span>
      </div>
    </div>
  );
}

export { ScoreRing, type ScoreRingProps };
