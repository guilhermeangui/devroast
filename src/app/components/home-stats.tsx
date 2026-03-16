"use client";

import NumberFlow from "@number-flow/react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

export function HomeStats() {
  const trpc = useTRPC();
  const { data } = useQuery(trpc.stats.getStats.queryOptions());

  return (
    <div className="flex items-center gap-6 font-mono text-xs text-text-tertiary">
      <span>
        <NumberFlow value={data?.totalRoasts ?? 0} /> codes roasted
      </span>
      <span>·</span>
      <span>
        avg score:{" "}
        <NumberFlow
          value={data?.avgScore ?? 0}
          format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
        />
        /10
      </span>
    </div>
  );
}
