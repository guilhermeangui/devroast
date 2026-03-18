export function LeaderboardEntriesSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      {["1", "2", "3", "4", "5"].map((n) => (
        <div
          key={n}
          className="animate-pulse overflow-hidden border border-border-primary"
        >
          {/* Meta row skeleton */}
          <div className="flex h-12 items-center justify-between border-b border-border-primary px-5">
            <div className="flex items-center gap-4">
              <div className="h-3 w-8 rounded-sm bg-bg-elevated" />
              <div className="h-3 w-12 rounded-sm bg-bg-elevated" />
            </div>
            <div className="flex items-center gap-3">
              <div className="h-3 w-16 rounded-sm bg-bg-elevated" />
              <div className="h-3 w-10 rounded-sm bg-bg-elevated" />
            </div>
          </div>

          {/* Code block skeleton */}
          <div className="flex h-[130px] bg-bg-input">
            <div className="w-10 shrink-0 border-r border-border-primary bg-bg-surface" />
            <div className="flex-1 p-3.5">
              <div className="flex flex-col gap-2">
                <div className="h-2.5 w-3/4 rounded-sm bg-bg-elevated" />
                <div className="h-2.5 w-1/2 rounded-sm bg-bg-elevated" />
                <div className="h-2.5 w-2/3 rounded-sm bg-bg-elevated" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
