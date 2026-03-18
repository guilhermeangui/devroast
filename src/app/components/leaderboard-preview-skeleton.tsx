export function LeaderboardPreviewSkeleton() {
  return (
    <>
      {/* Table */}
      <div className="overflow-hidden border border-border-primary">
        {/* Real header — anchors column widths */}
        <div className="flex items-center border-b border-border-primary bg-bg-surface px-5 py-3">
          <span className="w-[50px] shrink-0 font-mono text-xs font-medium text-text-tertiary">
            #
          </span>
          <span className="w-[70px] shrink-0 font-mono text-xs font-medium text-text-tertiary">
            score
          </span>
          <span className="flex-1 font-mono text-xs font-medium text-text-tertiary">
            code
          </span>
          <span className="w-[100px] shrink-0 pl-4 font-mono text-xs font-medium text-text-tertiary">
            lang
          </span>
        </div>

        {/* Skeleton rows */}
        {[1, 2, 3].map((rank) => (
          <div
            key={rank}
            className="flex animate-pulse border-b border-border-primary px-5 py-4 last:border-b-0"
          >
            {/* rank */}
            <div className="w-[50px] shrink-0 pt-0.5">
              <div className="h-3 w-3 rounded-sm bg-bg-elevated" />
            </div>

            {/* score */}
            <div className="w-[70px] shrink-0 pt-0.5">
              <div className="h-3 w-8 rounded-sm bg-bg-elevated" />
            </div>

            {/* code block placeholder */}
            <div className="flex flex-1 flex-col gap-2">
              {/* simulates a code block with multiple lines */}
              <div className="flex flex-col gap-1.5">
                <div className="h-3 w-3/4 rounded-sm bg-bg-elevated" />
                <div className="h-3 w-full rounded-sm bg-bg-elevated" />
                <div className="h-3 w-2/3 rounded-sm bg-bg-elevated" />
                <div className="h-3 w-1/2 rounded-sm bg-bg-elevated" />
              </div>
              {/* trigger placeholder */}
              <div className="h-2.5 w-24 rounded-sm bg-bg-elevated" />
            </div>

            {/* lang + link */}
            <div className="flex w-[100px] shrink-0 flex-col gap-2 pl-4">
              <div className="h-3 w-16 rounded-sm bg-bg-elevated" />
              <div className="h-2.5 w-14 rounded-sm bg-bg-elevated" />
            </div>
          </div>
        ))}
      </div>

      {/* Footer skeleton */}
      <div className="flex animate-pulse justify-center">
        <div className="h-3 w-64 rounded-sm bg-bg-elevated" />
      </div>
    </>
  );
}
