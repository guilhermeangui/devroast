export function LeaderboardPreviewSkeleton() {
  return (
    <>
      {/* Table */}
      <div className="overflow-hidden border border-border-primary">
        {/* Table Header */}
        <div className="flex items-center bg-bg-surface px-5 py-3 border-b border-border-primary">
          <span className="w-[50px] shrink-0 font-mono text-xs font-medium text-text-tertiary">
            #
          </span>
          <span className="w-[70px] shrink-0 font-mono text-xs font-medium text-text-tertiary">
            score
          </span>
          <span className="flex-1 font-mono text-xs font-medium text-text-tertiary">
            code
          </span>
          <span className="w-[100px] shrink-0 font-mono text-xs font-medium text-text-tertiary">
            lang
          </span>
        </div>

        {/* Skeleton Rows */}
        {[1, 2, 3].map((rank) => (
          <div
            key={rank}
            className="flex items-start border-b border-border-primary px-5 py-4 last:border-b-0 animate-pulse"
          >
            {/* rank */}
            <div className="w-[50px] shrink-0">
              <div className="h-3 w-3 rounded-sm bg-bg-elevated" />
            </div>

            {/* score */}
            <div className="w-[70px] shrink-0">
              <div className="h-3 w-8 rounded-sm bg-bg-elevated" />
            </div>

            {/* code lines */}
            <div className="flex flex-1 flex-col gap-1.5">
              <div className="h-3 w-3/4 rounded-sm bg-bg-elevated" />
              <div className="h-3 w-1/2 rounded-sm bg-bg-elevated" />
              <div className="h-3 w-2/5 rounded-sm bg-bg-elevated" />
            </div>

            {/* lang */}
            <div className="w-[100px] shrink-0">
              <div className="h-3 w-16 rounded-sm bg-bg-elevated" />
            </div>
          </div>
        ))}
      </div>

      {/* Footer Hint Skeleton */}
      <div className="flex justify-center animate-pulse">
        <div className="h-3 w-64 rounded-sm bg-bg-elevated" />
      </div>
    </>
  );
}
