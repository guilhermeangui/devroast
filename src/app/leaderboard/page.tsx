import type { Metadata } from "next";
import { Suspense } from "react";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import { LeaderboardEntries } from "./components/leaderboard-entries";
import { LeaderboardEntriesSkeleton } from "./components/leaderboard-entries-skeleton";
import { LeaderboardStats } from "./components/leaderboard-stats";

export const metadata: Metadata = {
  title: "Shame Leaderboard | devroast",
  description:
    "The most roasted code on the internet. See which code snippets got the worst scores from our AI-powered code roaster.",
};

export default function LeaderboardPage() {
  prefetch(trpc.leaderboard.getTop20.queryOptions());

  return (
    <HydrateClient>
      <main className="mx-auto max-w-5xl px-20 py-10">
        <div className="flex flex-col gap-10">
          {/* Hero Section */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="font-mono text-[32px] font-bold text-accent-green">
                {">"}
              </span>
              <h1 className="font-mono text-[28px] font-bold text-text-primary">
                shame_leaderboard
              </h1>
            </div>

            <p className="font-mono text-sm text-text-secondary">
              {"// the most roasted code on the internet"}
            </p>

            <LeaderboardStats />
          </section>

          {/* Leaderboard Entries */}
          <section>
            <Suspense fallback={<LeaderboardEntriesSkeleton />}>
              <LeaderboardEntries />
            </Suspense>
          </section>
        </div>
      </main>
    </HydrateClient>
  );
}
