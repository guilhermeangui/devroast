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
