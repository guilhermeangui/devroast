# App Patterns

Conventions for pages and components inside `src/app/`.

## Pages

- Pages use `export default` (required by Next.js) — the only exception to the named-exports rule.
- Prefer **async Server Components** for pages. Move client interactivity into dedicated `"use client"` components.
- Co-located client components that are only used by one page live in `src/app/components/`.

## Data Fetching

All data fetching goes through **tRPC**. See `src/trpc/AGENTS.md` for procedure and hook conventions.

### Server Component pages with dynamic data

Use `prefetch` + `HydrateClient` to kick off queries on the server:

```tsx
import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import { MyClientComponent } from "./components/my-client-component";

export default function Page() {
  prefetch(trpc.someRouter.someProc.queryOptions());
  return (
    <HydrateClient>
      <MyClientComponent />
    </HydrateClient>
  );
}
```

The `prefetch` call is **not awaited** — it starts the query without blocking the HTML stream.

## Loading States

Two strategies depending on the UX goal:

### 1. Suspense + skeleton (hard boundary)

Use when the page section should show a placeholder until data is ready:

```tsx
import { Suspense } from "react";
import { MyComponentSkeleton } from "./components/my-component-skeleton";
import { MyComponent } from "./components/my-component";

// page.tsx
<Suspense fallback={<MyComponentSkeleton />}>
  <MyComponent />   {/* uses useSuspenseQuery internally */}
</Suspense>
```

Inside the component, use `useSuspenseQuery` — it suspends until data arrives, so `data` is always defined.

### 2. Optimistic initial value (smooth animation)

Use when the element should render immediately with a sensible default and animate to the real value once data loads. The primary use case is numeric counters with `NumberFlow`:

```tsx
"use client";
import NumberFlow from "@number-flow/react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

export function StatsCounter() {
  const trpc = useTRPC();
  const { data } = useQuery(trpc.stats.getStats.queryOptions());

  return <NumberFlow value={data?.totalRoasts ?? 0} />;
  // Renders 0 instantly, animates to real value when data arrives
}
```

Use `useQuery` (not `useSuspenseQuery`) so the component renders immediately without suspending. Provide `?? 0` (or another appropriate default) for the initial render. No `<Suspense>` or skeleton needed.

## Skeleton Components

Skeletons live alongside their real counterpart in `src/app/components/`, suffixed with `-skeleton`:

```
components/
  leaderboard-preview.tsx          # real component ("use client", useSuspenseQuery)
  leaderboard-preview-skeleton.tsx # skeleton (no directives, pure JSX)
```

Rules:
- **No `"use client"` directive** — skeletons are pure JSX with no hooks, safe to render in Server Components.
- **Replicate the exact structure** of the real component (same column widths, padding, borders) so the layout does not shift when data arrives.
- Use `animate-pulse` on each row wrapper. Apply it at the row level, not the individual block, so the entire row pulses together.
- Use `bg-bg-elevated` for placeholder blocks — matches the surface palette without hardcoding colors.
- Keep the real table header (with actual text labels) in the skeleton so column widths are anchored during loading.

```tsx
// leaderboard-preview-skeleton.tsx
export function LeaderboardPreviewSkeleton() {
  return (
    <>
      <div className="overflow-hidden border border-border-primary">
        {/* Real header — anchors column widths */}
        <div className="flex items-center bg-bg-surface px-5 py-3 border-b border-border-primary">
          <span className="w-[50px] shrink-0 font-mono text-xs font-medium text-text-tertiary">#</span>
          {/* … */}
        </div>

        {[1, 2, 3].map((rank) => (
          <div key={rank} className="flex items-start border-b border-border-primary px-5 py-4 last:border-b-0 animate-pulse">
            <div className="w-[50px] shrink-0"><div className="h-3 w-3 rounded-sm bg-bg-elevated" /></div>
            {/* … */}
          </div>
        ))}
      </div>

      <div className="flex justify-center animate-pulse">
        <div className="h-3 w-64 rounded-sm bg-bg-elevated" />
      </div>
    </>
  );
}
```

## Animated Numbers

Use `@number-flow/react` (`<NumberFlow>`) for any counter or metric that should animate when its value changes.

```tsx
import NumberFlow from "@number-flow/react";

<NumberFlow value={count} />
<NumberFlow value={score} format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} />
<NumberFlow value={price} format={{ style: "currency", currency: "USD" }} suffix="/mo" />
```

- Always pair with `useQuery` + `?? 0` default so the animation runs from 0 → real value on first load.
- Pass `format` using `Intl.NumberFormatOptions` for locale-aware formatting.
