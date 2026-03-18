# tRPC Patterns

Conventions for the tRPC API layer (`src/trpc/`).

## File Responsibilities

| File | Boundary | Purpose |
|---|---|---|
| `init.ts` | Server | `initTRPC`, `createTRPCContext` (exposes `db`), base helpers |
| `query-client.ts` | Shared | `makeQueryClient()` factory — used on both server and client |
| `server.tsx` | Server only (`server-only`) | `trpc` proxy, `getQueryClient`, `HydrateClient`, `prefetch`, `caller` |
| `client.tsx` | Client only (`use client`) | `TRPCReactProvider`, `useTRPC` |
| `routers/_app.ts` | Server | Root `appRouter` and `AppRouter` type export |
| `routers/*.ts` | Server | Feature routers — one file per domain |

Never import `server.tsx` in Client Components. Never import `client.tsx` in Server Components. The `server-only` and `use client` directives enforce this at build time.

## Context

`createTRPCContext` is wrapped in React's `cache()` — it runs once per request and exposes `db`:

```ts
export const createTRPCContext = cache(async () => {
  return { db };
});
```

Procedures access the database via `ctx.db` using Drizzle's Core API directly.

## Adding a New Router

1. Create `src/trpc/routers/<domain>.ts` and export a `<domain>Router`.
2. Register it in `src/trpc/routers/_app.ts`:

```ts
export const appRouter = createTRPCRouter({
  stats: statsRouter,
  roast: roastRouter, // new
});
```

## Procedures

- Use `baseProcedure` for all public procedures (no auth yet).
- Validate input with **Zod**.
- Return plain serializable objects — no `Date`, `Map`, etc. (no superjson configured).

```ts
export const myRouter = createTRPCRouter({
  getById: baseProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db.select().from(table).where(eq(table.id, input.id));
      return result[0] ?? null;
    }),
});
```

## Server Components — Prefetch Pattern

Use `prefetch` + `HydrateClient` to start a query on the server without blocking the render. The data streams to the client and becomes available to Client Components via `useQuery` / `useSuspenseQuery`.

```tsx
// Server Component (page.tsx)
import { HydrateClient, prefetch, trpc } from "@/trpc/server";

export default function Page() {
  prefetch(trpc.stats.getStats.queryOptions());
  return (
    <HydrateClient>
      <ClientComponent />
    </HydrateClient>
  );
}
```

- `prefetch` is **not awaited** — it fires the query without blocking the HTML response.
- `HydrateClient` wraps the subtree that needs the prefetched data.

## Server Components — Direct Data (caller)

When data is only needed in a Server Component and does not need to hydrate client state, use `caller` directly:

```tsx
import { caller } from "@/trpc/server";

export default async function Page() {
  const stats = await caller.stats.getStats();
  return <div>{stats.totalRoasts}</div>;
}
```

## Client Components — Consuming Data

Always call `useTRPC()` to get the typed client, then pass `.queryOptions()` or `.mutationOptions()` to TanStack Query hooks:

```tsx
"use client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

export function MyComponent() {
  const trpc = useTRPC();
  const { data } = useQuery(trpc.stats.getStats.queryOptions());
  const submit = useMutation(trpc.roast.submit.mutationOptions());
}
```

### `useQuery` vs `useSuspenseQuery`

| Hook | Behavior | When to use |
|---|---|---|
| `useQuery` | `data` starts as `undefined`, no suspension | Loading states handled inside the component (e.g. `data ?? 0` for animations) |
| `useSuspenseQuery` | Suspends until data is ready | When paired with a `<Suspense>` boundary and skeleton |

Prefer `useQuery` with a sensible initial value (e.g. `0`) when the goal is to animate from the initial value to the real one (e.g. via `NumberFlow`).
