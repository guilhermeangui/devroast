import { Badge } from "@/components/ui/badge";
import { DiffLine } from "@/components/ui/diff-line";
import { ScoreRing } from "@/components/ui/score-ring";

const roastData = {
  score: 3.5,
  verdict: "needs_serious_help" as const,
  quote:
    '"this code looks like it was written during a power outage... in 2005."',
  language: "javascript",
  lines: 7,
  code: [
    "function calculateTotal(items) {",
    "  var total = 0;",
    "  for (var i = 0; i < items.length; i++) {",
    "    total = total + items[i].price;",
    "  }",
    " ",
    "  function applyDiscount(total, discount) {",
    "    var result = total - (total * discount);",
    "    return result;",
    "  }",
    " ",
    "  // TODO: handle tax calculation",
    "  // TODO: handle currency conversion",
    " ",
    "  return total;",
    "}",
  ],
  issues: [
    {
      variant: "critical" as const,
      label: "critical",
      title: "using var instead of const/let",
      description:
        "var is function-scoped and leads to hoisting bugs. use const by default, let when reassignment is needed.",
    },
    {
      variant: "warning" as const,
      label: "warning",
      title: "imperative loop pattern",
      description:
        "for loops are verbose and error-prone. use .reduce() or .map() for cleaner, functional transformations.",
    },
    {
      variant: "good" as const,
      label: "good",
      title: "clear naming conventions",
      description:
        "calculateTotal and items are descriptive, self-documenting names that communicate intent without comments.",
    },
    {
      variant: "good" as const,
      label: "good",
      title: "single responsibility",
      description:
        "the function does one thing well — calculates a total. no side effects, no mixed concerns, no hidden complexity.",
    },
  ],
  diff: {
    filename: "your_code.ts → improved_code.ts",
    lines: [
      { type: "context" as const, code: "function calculateTotal(items) {" },
      { type: "removed" as const, code: "  var total = 0;" },
      {
        type: "removed" as const,
        code: "  for (var i = 0; i < items.length; i++) {",
      },
      {
        type: "removed" as const,
        code: "    total = total + items[i].price;",
      },
      { type: "removed" as const, code: "  }" },
      { type: "removed" as const, code: "  return total;" },
      {
        type: "added" as const,
        code: "  return items.reduce((sum, item) => sum + item.price, 0);",
      },
      { type: "context" as const, code: "}" },
    ],
  },
};

function getVerdictVariant(
  score: number,
): "critical" | "warning" | "good" | "info" {
  if (score <= 3.5) return "critical";
  if (score <= 6.5) return "warning";
  return "good";
}

export default function RoastPage() {
  const data = roastData;
  const verdictVariant = getVerdictVariant(data.score);

  return (
    <main className="mx-auto max-w-5xl px-10 py-10">
      <div className="flex flex-col gap-10">
        {/* Score Hero */}
        <section className="flex items-center gap-12">
          <ScoreRing score={data.score} />

          <div className="flex flex-1 flex-col gap-4">
            <Badge variant={verdictVariant}>{`verdict: ${data.verdict}`}</Badge>

            <p className="text-xl leading-relaxed text-text-primary">
              {data.quote}
            </p>

            <div className="flex items-center gap-4 font-mono text-xs text-text-tertiary">
              <span>lang: {data.language}</span>
              <span>·</span>
              <span>{data.lines} lines</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                className="border border-border-primary px-4 py-2 font-mono text-xs text-text-primary transition-colors hover:bg-bg-surface"
              >
                $ share_roast
              </button>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="h-px bg-border-primary" />

        {/* Submitted Code */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-accent-green">
              {"//"}
            </span>
            <span className="font-mono text-sm font-bold text-text-primary">
              your_submission
            </span>
          </div>

          <div className="overflow-hidden border border-border-primary bg-bg-input">
            <div className="flex">
              {/* Line Numbers */}
              <div className="flex w-12 shrink-0 flex-col items-end gap-2 border-r border-border-primary bg-bg-surface px-3 py-4">
                {data.code.map((_line, i) => (
                  <span
                    key={`ln-${_line}-${i.toString()}`}
                    className="font-mono text-xs text-text-tertiary"
                  >
                    {i + 1}
                  </span>
                ))}
              </div>

              {/* Code */}
              <div className="flex flex-col gap-2 p-4">
                {data.code.map((line, i) => (
                  <span
                    key={`code-${line}-${i.toString()}`}
                    className={`font-mono text-xs ${
                      line.trimStart().startsWith("//")
                        ? "text-syn-comment"
                        : "text-syn-operator"
                    }`}
                  >
                    {line}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="h-px bg-border-primary" />

        {/* Detailed Analysis */}
        <section className="flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-accent-green">
              {"//"}
            </span>
            <span className="font-mono text-sm font-bold text-text-primary">
              detailed_analysis
            </span>
          </div>

          <div className="grid grid-cols-2 gap-5">
            {data.issues.map((issue) => (
              <div
                key={issue.title}
                className="flex flex-col gap-3 border border-border-primary p-5"
              >
                <Badge variant={issue.variant}>{issue.label}</Badge>
                <span className="font-mono text-[13px] font-medium text-text-primary">
                  {issue.title}
                </span>
                <p className="text-xs leading-relaxed text-text-secondary">
                  {issue.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Divider */}
        <div className="h-px bg-border-primary" />

        {/* Suggested Fix */}
        <section className="flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-accent-green">
              {"//"}
            </span>
            <span className="font-mono text-sm font-bold text-text-primary">
              suggested_fix
            </span>
          </div>

          <div className="overflow-hidden border border-border-primary bg-bg-input">
            {/* Diff Header */}
            <div className="flex h-10 items-center border-b border-border-primary px-4">
              <span className="font-mono text-xs font-medium text-text-secondary">
                {data.diff.filename}
              </span>
            </div>

            {/* Diff Body */}
            <div className="flex flex-col py-1">
              {data.diff.lines.map((line, i) => (
                <DiffLine
                  key={`diff-${line.code}-${i.toString()}`}
                  type={line.type}
                >
                  {line.code}
                </DiffLine>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
