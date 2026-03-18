# Leaderboard Page Real Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire `/leaderboard` page to real DB data showing the top 20 worst-scored code snippets, with animated stats header (NumberFlow) and server-side Shiki syntax highlighting — following the same patterns as the homepage shame leaderboard.

**Architecture:** Add `leaderboard.getTop20` tRPC procedure that returns up to 20 entries ordered by `score ASC` plus total/avg stats in a single `Promise.all`. The `/leaderboard/page.tsx` becomes a Server Component that uses `prefetch + HydrateClient` for the animated stats (`LeaderboardStats` client component), plus a `<Suspense>` boundary wrapping a new `LeaderboardEntries` async Server Component that calls Shiki server-side and renders card-format entries.

**Tech Stack:** Next.js App Router (async Server Components), tRPC v11 / Drizzle ORM, Shiki (`codeToHtml`, vesper theme), `@number-flow/react`, Tailwind CSS v4, TypeScript

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/trpc/routers/leaderboard.ts` | Modify | Add `getTop20` procedure |
| `src/app/leaderboard/page.tsx` | Modify | Wire to real data via tRPC prefetch + Suspense |
| `src/app/leaderboard/components/leaderboard-stats.tsx` | Create | Client component — animated NumberFlow stats header |
| `src/app/leaderboard/components/leaderboard-entries.tsx` | Create | Async Server Component — fetches top 20, runs Shiki, renders cards |
| `src/app/leaderboard/components/leaderboard-entries-skeleton.tsx` | Create | Skeleton for Suspense fallback |

---

## Task 1: Add `getTop20` tRPC procedure

**Files:**
- Modify: `src/trpc/routers/leaderboard.ts`

The procedure mirrors `getTop3` but with `limit(20)` and also returns `avgScore` for the stats header.

- [ ] **Step 1: Open `src/trpc/routers/leaderboard.ts` and add the `getTop20` procedure**

```ts
// src/trpc/routers/leaderboard.ts
import { asc, avg, count } from "drizzle-orm";
import { roasts } from "@/db/schema";
import { baseProcedure, createTRPCRouter } from "../init";

export const leaderboardRouter = createTRPCRouter({
  getTop3: baseProcedure.query(async ({ ctx }) => {
    const [top3, statsResult] = await Promise.all([
      ctx.db
        .select({
          id: roasts.id,
          score: roasts.score,
          code: roasts.code,
          language: roasts.language,
          lineCount: roasts.lineCount,
        })
        .from(roasts)
        .orderBy(asc(roasts.score))
        .limit(3),

      ctx.db.select({ totalRoasts: count() }).from(roasts),
    ]);

    return {
      entries: top3.map((row, index) => ({
        rank: index + 1,
        id: row.id,
        score: Number(row.score),
        code: row.code,
        language: row.language,
        lineCount: row.lineCount,
      })),
      totalRoasts: statsResult[0]?.totalRoasts ?? 0,
    };
  }),

  getTop20: baseProcedure.query(async ({ ctx }) => {
    const [top20, statsResult] = await Promise.all([
      ctx.db
        .select({
          id: roasts.id,
          score: roasts.score,
          code: roasts.code,
          language: roasts.language,
          lineCount: roasts.lineCount,
        })
        .from(roasts)
        .orderBy(asc(roasts.score))
        .limit(20),

      ctx.db
        .select({ totalRoasts: count(), avgScore: avg(roasts.score) })
        .from(roasts),
    ]);

    return {
      entries: top20.map((row, index) => ({
        rank: index + 1,
        id: row.id,
        score: Number(row.score),
        code: row.code,
        language: row.language,
        lineCount: row.lineCount,
      })),
      totalRoasts: statsResult[0]?.totalRoasts ?? 0,
      avgScore: Number(statsResult[0]?.avgScore ?? 0),
    };
  }),
});
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
pnpm tsc --noEmit
```

Expected: no errors related to `leaderboard.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/trpc/routers/leaderboard.ts
git commit -m "feat: add leaderboard.getTop20 procedure with avg score"
```

---

## Task 2: Create `LeaderboardStats` client component

**Files:**
- Create: `src/app/leaderboard/components/leaderboard-stats.tsx`

This is the animated stats header, analogous to `HomeStats` on the homepage. Uses `useQuery` + NumberFlow so the numbers animate from 0 to real values.

- [ ] **Step 1: Create the directory and file**

```bash
mkdir -p src/app/leaderboard/components
```

- [ ] **Step 2: Write `leaderboard-stats.tsx`**

```tsx
// src/app/leaderboard/components/leaderboard-stats.tsx
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
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
pnpm tsc --noEmit
```

Expected: no errors.

---

## Task 3: Create `LeaderboardEntriesSkeleton` component

**Files:**
- Create: `src/app/leaderboard/components/leaderboard-entries-skeleton.tsx`

Skeleton replicates the card structure (header row + code block placeholder) with `animate-pulse`. Renders 5 skeleton cards.

- [ ] **Step 1: Write `leaderboard-entries-skeleton.tsx`**

```tsx
// src/app/leaderboard/components/leaderboard-entries-skeleton.tsx

export function LeaderboardEntriesSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      {Array.from({ length: 5 }, (_, i) => (
        <div
          key={i}
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
          <div className="flex h-[120px] bg-bg-input">
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
```

---

## Task 4: Create `LeaderboardEntries` async Server Component

**Files:**
- Create: `src/app/leaderboard/components/leaderboard-entries.tsx`

Async Server Component that calls `caller.leaderboard.getTop20()`, runs Shiki in parallel for all entries, and renders card-format entries. Reuses the same `SHIKI_LANG` map and `getScoreColor` helper as in the codebase.

- [ ] **Step 1: Write `leaderboard-entries.tsx`**

```tsx
// src/app/leaderboard/components/leaderboard-entries.tsx
import type { BundledLanguage } from "shiki";
import { codeToHtml } from "shiki";
import { caller } from "@/trpc/server";

const SHIKI_LANG: Record<string, BundledLanguage> = {
  javascript: "javascript",
  typescript: "typescript",
  python: "python",
  rust: "rust",
  go: "go",
  java: "java",
  c: "c",
  cpp: "cpp",
  csharp: "csharp",
  php: "php",
  ruby: "ruby",
  swift: "swift",
  kotlin: "kotlin",
  sql: "sql",
  shell: "bash",
  other: "typescript",
};

function getScoreColor(score: number): string {
  if (score <= 3.5) return "text-accent-red";
  if (score <= 6.5) return "text-accent-amber";
  return "text-accent-green";
}

export async function LeaderboardEntries() {
  const { entries } = await caller.leaderboard.getTop20();

  const rows = await Promise.all(
    entries.map(async (entry) => {
      const lang = SHIKI_LANG[entry.language] ?? "typescript";
      const highlightedHtml = await codeToHtml(entry.code, {
        lang,
        theme: "vesper",
      });
      return { ...entry, highlightedHtml };
    }),
  );

  return (
    <div className="flex flex-col gap-5">
      {rows.map((entry) => {
        const lines = entry.code.split("\n");
        return (
          <div
            key={entry.id}
            className="overflow-hidden border border-border-primary"
          >
            {/* Meta Row */}
            <div className="flex h-12 items-center justify-between border-b border-border-primary px-5">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs text-text-tertiary">#</span>
                  <span className="font-mono text-sm font-bold text-accent-amber">
                    {entry.rank}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs text-text-tertiary">
                    score
                  </span>
                  <span
                    className={`font-mono text-sm font-bold ${getScoreColor(entry.score)}`}
                  >
                    {entry.score.toFixed(1)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-text-secondary">
                  {entry.language}
                </span>
                <span className="font-mono text-xs text-text-tertiary">
                  {lines.length} {lines.length === 1 ? "line" : "lines"}
                </span>
              </div>
            </div>

            {/* Code Block */}
            <div className="flex h-[120px] overflow-hidden bg-bg-input">
              {/* Line Numbers */}
              <div className="flex w-10 shrink-0 flex-col items-end gap-1.5 border-r border-border-primary bg-bg-surface px-2.5 py-3.5">
                {Array.from({ length: lines.length }, (_, i) => i + 1).map(
                  (n) => (
                    <span
                      key={n}
                      className="font-mono text-xs leading-tight text-text-tertiary"
                    >
                      {n}
                    </span>
                  ),
                )}
              </div>

              {/* Code Content */}
              <div
                className="flex-1 overflow-hidden p-3.5 pl-4 font-mono text-xs leading-relaxed [&>pre]:!bg-transparent [&_code]:font-mono [&_code_.line]:block [&_code_.line]:leading-tight"
                // biome-ignore lint/security/noDangerouslySetInnerHtml: HTML gerado pelo Shiki no servidor, seguro
                dangerouslySetInnerHTML={{ __html: entry.highlightedHtml }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
pnpm tsc --noEmit
```

Expected: no errors.

---

## Task 5: Wire `/leaderboard/page.tsx` to real data

**Files:**
- Modify: `src/app/leaderboard/page.tsx`

Replace static data with: `prefetch` for `getTop20` (feeds `LeaderboardStats`), `<Suspense>` with skeleton wrapping `<LeaderboardEntries>`. Keep the existing `metadata`, header structure, and card styles.

- [ ] **Step 1: Rewrite `src/app/leaderboard/page.tsx`**

```tsx
// src/app/leaderboard/page.tsx
import { Suspense } from "react";
import type { Metadata } from "next";
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
```

- [ ] **Step 2: Verify TypeScript compiles clean**

```bash
pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Run linter and fix any issues**

```bash
pnpm exec biome check --write src/app/leaderboard/
```

Expected: no remaining issues.

- [ ] **Step 4: Start dev server and verify the page renders correctly**

```bash
pnpm dev
```

Open `http://localhost:3000/leaderboard` and confirm:
- Stats header shows animated numbers (totalRoasts, avgScore)
- Up to 20 cards render with real code snippets, Shiki syntax highlighting, rank, score, language and line count
- Skeleton shows briefly before data loads (can test by adding `await new Promise(r => setTimeout(r, 2000))` in `LeaderboardEntries` temporarily)
- No console errors

- [ ] **Step 5: Commit**

```bash
git add src/app/leaderboard/
git commit -m "feat: wire leaderboard page to real DB data with animated stats"
```
