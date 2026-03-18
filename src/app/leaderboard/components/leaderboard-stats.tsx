"use client";

import NumberFlow from "@number-flow/react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

export function LeaderboardStats() {
  const trpc = useTRPC();
  const { data } = useQuery(trpc.leaderboard.getTop20.queryOptions());

  return (
    <div className="flex items-center gap-2 font-mono text-xs text-text-tertiary">
      <NumberFlow value={data?.totalRoasts ?? 0} />
      <span> submissions</span>
      <span>·</span>
      <span>avg score:</span>
      <NumberFlow
        value={data?.avgScore ?? 0}
        format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
      />
      <span>/10</span>
    </div>
  );
}
