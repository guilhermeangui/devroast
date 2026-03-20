import { verdictEnum } from "@/db/schema/enums";

export type Verdict = (typeof verdictEnum.enumValues)[number];

export const verdictColor: Record<Verdict, string> = {
  needs_serious_help: "#ef4444",
  pretty_bad: "#f97316",
  could_be_worse: "#eab308",
  not_terrible: "#3b82f6",
  surprisingly_good: "#22c55e",
};
