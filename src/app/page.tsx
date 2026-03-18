import { Suspense } from "react";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import { HomeStats } from "./components/home-stats";
import { LeaderboardPreview } from "./components/leaderboard-preview";
import { LeaderboardPreviewSkeleton } from "./components/leaderboard-preview-skeleton";
import { ActionsBar, CodeEditor } from "./home-client";

export default function Home() {
  prefetch(trpc.stats.getStats.queryOptions());
  prefetch(trpc.leaderboard.getTop3.queryOptions());

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
            <a
              href="/leaderboard"
              className="border border-border-primary px-3 py-1.5 font-mono text-xs text-text-secondary transition-colors hover:text-text-primary"
            >
              {"$ view_all >>"}
            </a>
          </div>

          <p className="font-mono text-[13px] text-text-tertiary">
            {"// the worst code on the internet, ranked by shame"}
          </p>

          <Suspense fallback={<LeaderboardPreviewSkeleton />}>
            <LeaderboardPreview />
          </Suspense>
        </section>
      </main>
    </HydrateClient>
  );
}
