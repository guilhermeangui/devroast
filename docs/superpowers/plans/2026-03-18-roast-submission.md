# Roast Submission Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to paste code, toggle roast mode, click submit, and get an AI-generated code review at `/roast/[id]`.

**Architecture:** A tRPC mutation (`roast.submit`) calls Anthropic via `generateText + Output.object`, derives the verdict from the score, persists the result in Postgres via Drizzle, and returns the `id`. The client redirects to `/roast/[id]` which fetches data via `caller.roast.getById(id)` — a direct server-side DB call, no client hydration needed.

**Tech Stack:** Next.js 16 App Router, tRPC v11, Drizzle ORM + PostgreSQL, Vercel AI SDK (`ai` + `@ai-sdk/anthropic`), Zod v4

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `package.json` | Modify | Add `ai` and `@ai-sdk/anthropic` deps |
| `.env.local` | Modify | Uncomment/add `ANTHROPIC_API_KEY` |
| `src/trpc/routers/roast.ts` | **Create** | `submit` mutation + `getById` query |
| `src/trpc/routers/_app.ts` | Modify | Register `roastRouter` |
| `src/app/home-client.tsx` | Modify | Wire `CodeEditor`, `Toggle`, and `Button` to the mutation; redirect on success |
| `src/app/roast/[id]/page.tsx` | Modify | Replace mock data with `caller.roast.getById(id)`; handle `notFound()`; render `suggestedFix` conditionally |

---

## Task 1: Install dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install AI SDK packages**

```bash
pnpm add ai @ai-sdk/anthropic
```

Expected: both packages added to `dependencies` in `package.json` with no peer dep errors.

- [ ] **Step 2: Verify install**

```bash
pnpm list ai @ai-sdk/anthropic
```

Expected: both packages listed at their installed versions.

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add ai sdk and anthropic provider"
```

---

## Task 2: Add ANTHROPIC_API_KEY to environment

**Files:**
- Modify: `.env.local`

- [ ] **Step 1: Uncomment the key in `.env.example`**

Open `.env.example` and uncomment the `ANTHROPIC_API_KEY` line so it reads:
```
ANTHROPIC_API_KEY=sk-ant-...
```

- [ ] **Step 2: Add real key to `.env.local`**

In `.env.local`, replace the commented line:
```
# ANTHROPIC_API_KEY=sk-ant-...
```
with your real key:
```
ANTHROPIC_API_KEY=sk-ant-<your-real-key>
```

> Note: `.env.local` is gitignored. Never commit it.

- [ ] **Step 3: Commit the `.env.example` change**

```bash
git add .env.example
git commit -m "chore: document ANTHROPIC_API_KEY in env.example"
```

---

## Task 3: Create the `roast` tRPC router

**Files:**
- Create: `src/trpc/routers/roast.ts`

This is the core of the feature. One file with:
1. The Zod schema for the AI output
2. A pure function to derive `verdict` from `score`
3. A prompt builder
4. The `submit` mutation
5. The `getById` query

- [ ] **Step 1: Create `src/trpc/routers/roast.ts`**

```typescript
import { generateText, Output } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { roasts } from "@/db/schema";
import type { Roast } from "@/db/schema";
import { baseProcedure, createTRPCRouter } from "../init";

// ── AI output schema ───────────────────────────────────────────────────────

const roastOutputSchema = z.object({
  score: z.number().min(0).max(10),
  roastQuote: z.string(),
  issues: z
    .array(
      z.object({
        severity: z.enum(["critical", "warning", "good"]),
        title: z.string(),
        description: z.string(),
      }),
    )
    .min(2)
    .max(6),
  suggestedFix: z.string().nullable(),
  language: z.enum([
    "javascript",
    "typescript",
    "python",
    "rust",
    "go",
    "java",
    "c",
    "cpp",
    "csharp",
    "php",
    "ruby",
    "swift",
    "kotlin",
    "sql",
    "shell",
    "other",
  ]),
});

// ── Verdict derivation ─────────────────────────────────────────────────────

function scoreToVerdict(score: number): Roast["verdict"] {
  if (score < 3.0) return "needs_serious_help";
  if (score < 5.0) return "pretty_bad";
  if (score < 7.0) return "could_be_worse";
  if (score < 9.0) return "not_terrible";
  return "surprisingly_good";
}

// ── Prompt builder ─────────────────────────────────────────────────────────

function buildPrompt(code: string, language: string, roastMode: boolean): string {
  const persona = roastMode
    ? `You are a brutally sarcastic senior engineer who roasts bad code mercilessly. Use sharp wit, dark humor, and cutting observations. No mercy.`
    : `You are a professional senior engineer giving an honest, direct technical code review. Be critical but constructive.`;

  return `${persona}

Analyze the following ${language} code and return a structured review.

Rules:
- score: a number from 0.0 to 10.0 (0 = catastrophically bad, 10 = near-perfect)
- roastQuote: a single punchy sentence that captures the code quality (${roastMode ? "make it savage and funny" : "make it direct and honest"})
- issues: 2 to 6 items covering what is wrong AND what is good (severity: "critical", "warning", or "good")
- suggestedFix: a unified diff showing the most impactful improvement, or null if no fix is needed
- language: the detected programming language (correct the input if wrong)

Code to review:
\`\`\`${language}
${code}
\`\`\``;
}

// ── Router ─────────────────────────────────────────────────────────────────

export const roastRouter = createTRPCRouter({
  submit: baseProcedure
    .input(
      z.object({
        code: z.string().min(1).max(50000),
        language: z.string(),
        roastMode: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const anthropic = createAnthropic();

      const { output } = await generateText({
        model: anthropic("claude-3-5-haiku-20241022"),
        output: Output.object({ schema: roastOutputSchema }),
        prompt: buildPrompt(input.code, input.language, input.roastMode),
      });

      const verdict = scoreToVerdict(output.score);
      const lineCount = input.code.split("\n").length;

      const [inserted] = await ctx.db
        .insert(roasts)
        .values({
          code: input.code,
          language: output.language,
          lineCount,
          roastMode: input.roastMode,
          score: String(output.score),
          roastQuote: output.roastQuote,
          verdict,
          issues: output.issues,
          suggestedFix: output.suggestedFix ?? null,
        })
        .returning({ id: roasts.id });

      return { id: inserted.id };
    }),

  getById: baseProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select()
        .from(roasts)
        .where(eq(roasts.id, input.id));
      return result[0] ?? null;
    }),
});
```

- [ ] **Step 2: Verify TypeScript compiles (no ts errors)**

```bash
pnpm exec tsc --noEmit
```

Expected: no errors related to `roast.ts`.

---

## Task 4: Register the router in `_app.ts`

**Files:**
- Modify: `src/trpc/routers/_app.ts`

- [ ] **Step 1: Add `roastRouter` to the app router**

Open `src/trpc/routers/_app.ts` and change it to:

```typescript
import { createTRPCRouter } from "../init";
import { leaderboardRouter } from "./leaderboard";
import { roastRouter } from "./roast";
import { statsRouter } from "./stats";

export const appRouter = createTRPCRouter({
  stats: statsRouter,
  leaderboard: leaderboardRouter,
  roast: roastRouter,
});

export type AppRouter = typeof appRouter;
```

- [ ] **Step 2: Verify TypeScript still clean**

```bash
pnpm exec tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/trpc/routers/roast.ts src/trpc/routers/_app.ts
git commit -m "feat(trpc): add roast router with submit mutation and getById query"
```

---

## Task 5: Wire the home page client to the mutation

**Files:**
- Modify: `src/app/home-client.tsx`

The `ActionsBar` currently has a static `Toggle` and a static `Button`. We need to:
1. Lift `code`/`language` state out of `CodeEditor` into `ActionsBar` (or a shared parent)
2. Control the `roastMode` toggle state
3. Fire the mutation on button click
4. Redirect on success

Since both `CodeEditor` and `ActionsBar` are exported from `home-client.tsx` and both are used in `page.tsx` independently, we need a wrapper component that owns the shared state.

- [ ] **Step 1: Rewrite `src/app/home-client.tsx`**

```typescript
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { CodeEditor } from "@/components/ui/code-editor";
import { Toggle } from "@/components/ui/toggle";

function SubmitForm() {
  const router = useRouter();
  const trpc = useTRPC();

  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [roastMode, setRoastMode] = useState(false);

  const { mutate, isPending, error } = useMutation(
    trpc.roast.submit.mutationOptions({
      onSuccess: (data) => {
        router.push(`/roast/${data.id}`);
      },
    }),
  );

  function handleSubmit() {
    if (!code.trim()) return;
    mutate({ code, language, roastMode });
  }

  return (
    <>
      <CodeEditor
        onChange={(newCode, newLang) => {
          setCode(newCode);
          setLanguage(newLang);
        }}
      />

      <div className="flex w-full max-w-[780px] items-center justify-between">
        <div className="flex items-center gap-4">
          <Toggle
            label="roast mode"
            checked={roastMode}
            onCheckedChange={setRoastMode}
          />
          <span className="font-mono text-xs text-text-tertiary">
            {"// maximum sarcasm enabled"}
          </span>
        </div>
        <Button
          variant="primary"
          size="lg"
          onClick={handleSubmit}
          disabled={isPending}
        >
          {isPending ? "$ roasting..." : "$ roast_my_code"}
        </Button>
      </div>

      {error && (
        <p className="font-mono text-xs text-accent-red">
          {`// error: ${error.message}`}
        </p>
      )}
    </>
  );
}

export { SubmitForm };
```

- [ ] **Step 2: Update `src/app/page.tsx` to use `SubmitForm`**

Open `src/app/page.tsx` and replace the `CodeEditor` + `ActionsBar` imports and usages with `SubmitForm`:

```typescript
import { Suspense } from "react";
import { HomeStats } from "./components/home-stats";
import { LeaderboardPreview } from "./components/leaderboard-preview";
import { LeaderboardPreviewSkeleton } from "./components/leaderboard-preview-skeleton";
import { SubmitForm } from "./home-client";

export default function Home() {
  return (
    <>
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

          <SubmitForm />

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
    </>
  );
}
```

- [ ] **Step 3: Check Toggle's API for `checked`/`onCheckedChange`**

The `Toggle` component wraps `@base-ui/react/switch`. Verify it accepts `checked` and `onCheckedChange` by reading `src/components/ui/toggle.tsx`. If it uses `defaultChecked` only (uncontrolled), update the Toggle component to pass through `checked` and `onCheckedChange` from `Switch.Root`.

To make it controlled, confirm `Switch.Root` from `@base-ui/react` accepts `checked` and `onCheckedChange` — it does, as it follows WAI-ARIA Switch pattern. Update `ToggleProps` if those props are not yet passed through.

- [ ] **Step 4: Verify TypeScript**

```bash
pnpm exec tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/home-client.tsx src/app/page.tsx
git commit -m "feat(home): wire SubmitForm to roast.submit mutation with redirect"
```

---

## Task 6: Replace mock data in the result page

**Files:**
- Modify: `src/app/roast/[id]/page.tsx`

The page currently uses a hardcoded `roastData` object. Replace with a real DB fetch via `caller`.

- [ ] **Step 1: Rewrite `src/app/roast/[id]/page.tsx`**

```typescript
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { BundledLanguage } from "shiki";
import { codeToHtml } from "shiki";

import { Badge } from "@/components/ui/badge";
import { ScoreRing } from "@/components/ui/score-ring";
import { caller } from "@/trpc/server";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: "Roast Result | devroast",
    description: `AI-powered code review result for roast ${id}. See your score, detailed analysis and suggested fixes.`,
  };
}

function getVerdictVariant(
  score: number,
): "critical" | "warning" | "good" | "info" {
  if (score <= 3.5) return "critical";
  if (score <= 6.5) return "warning";
  return "good";
}

export default async function RoastResultPage({ params }: Props) {
  const { id } = await params;

  const data = await caller.roast.getById({ id });
  if (!data) notFound();

  const score = Number(data.score);
  const verdictVariant = getVerdictVariant(score);
  const codeLines = data.code.split("\n");

  const codeHtml = await codeToHtml(data.code, {
    lang: (data.language as BundledLanguage) ?? "text",
    theme: "vesper",
  });

  return (
    <main className="mx-auto max-w-5xl px-20 py-10">
      <div className="flex flex-col gap-10">
        {/* Score Hero */}
        <section className="flex items-center gap-12">
          <ScoreRing score={score} />

          <div className="flex flex-1 flex-col gap-4">
            <Badge variant={verdictVariant}>{`verdict: ${data.verdict}`}</Badge>

            <p className="font-mono text-xl leading-[1.5] text-text-primary">
              {data.roastQuote}
            </p>

            <div className="flex items-center gap-4 font-mono text-xs text-text-tertiary">
              <span>lang: {data.language}</span>
              <span>·</span>
              <span>{data.lineCount} lines</span>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="h-px bg-border-primary" />

        {/* Submitted Code */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-accent-green">
              {"//"}
            </span>
            <span className="font-mono text-sm font-bold text-text-primary">
              your_submission
            </span>
          </div>

          <div className="overflow-hidden border border-border-primary bg-bg-input">
            <div className="flex">
              {/* Line Numbers */}
              <div className="flex w-12 shrink-0 flex-col items-end gap-2 border-r border-border-primary bg-bg-surface px-3 py-4">
                {Array.from({ length: codeLines.length }, (_, i) => i + 1).map(
                  (n) => (
                    <span
                      key={n}
                      className="font-mono text-xs text-text-tertiary"
                    >
                      {n}
                    </span>
                  ),
                )}
              </div>

              {/* Code with Shiki highlight */}
              <div
                className="flex-1 overflow-hidden p-4 font-mono text-xs [&>pre]:!bg-transparent [&_code]:font-mono [&_code_.line]:block [&_code_.line]:leading-loose"
                dangerouslySetInnerHTML={{ __html: codeHtml }}
              />
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="h-px bg-border-primary" />

        {/* Detailed Analysis */}
        <section className="flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-accent-green">
              {"//"}
            </span>
            <span className="font-mono text-sm font-bold text-text-primary">
              detailed_analysis
            </span>
          </div>

          <div className="grid grid-cols-2 gap-5">
            {(data.issues as Array<{ severity: "critical" | "warning" | "good"; title: string; description: string }>).map((issue) => (
              <div
                key={issue.title}
                className="flex flex-col gap-3 border border-border-primary p-5"
              >
                <Badge variant={issue.severity}>{issue.severity}</Badge>
                <span className="font-mono text-[13px] font-medium text-text-primary">
                  {issue.title}
                </span>
                <p className="font-mono text-xs leading-relaxed text-text-secondary">
                  {issue.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Suggested Fix — only if present */}
        {data.suggestedFix && (
          <>
            {/* Divider */}
            <div className="h-px bg-border-primary" />

            <section className="flex flex-col gap-6">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-accent-green">
                  {"//"}
                </span>
                <span className="font-mono text-sm font-bold text-text-primary">
                  suggested_fix
                </span>
              </div>

              <div className="overflow-hidden border border-border-primary bg-bg-input">
                <pre className="p-4 font-mono text-xs leading-relaxed text-text-primary whitespace-pre-wrap">
                  {data.suggestedFix}
                </pre>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
pnpm exec tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/roast/[id]/page.tsx
git commit -m "feat(roast): replace mock data with real DB fetch via caller"
```

---

## Task 7: End-to-end manual test

- [ ] **Step 1: Start the dev server (DB must be running)**

```bash
pnpm db:up   # start postgres docker container if not already running
pnpm dev
```

- [ ] **Step 2: Test the submit flow**

1. Open `http://localhost:3000`
2. The code editor should show the placeholder code
3. Toggle "roast mode" on
4. Click `$ roast_my_code`
5. Button should change to `$ roasting...` and be disabled
6. After ~5-15s, browser redirects to `/roast/<uuid>`
7. Page shows: score ring, verdict badge, quote, submitted code, issues grid, suggested fix

- [ ] **Step 3: Test with roast mode off**

Repeat step 2 with roast mode off. The tone should be more professional.

- [ ] **Step 4: Test error case**

Submit with empty code — button should not fire (guarded by `if (!code.trim()) return`).

- [ ] **Step 5: Test 404**

Navigate to `/roast/00000000-0000-0000-0000-000000000000` — should show Next.js 404 page.

---

## Task 8: Lint and format

- [ ] **Step 1: Run Biome check and auto-fix**

```bash
pnpm exec biome check --write
```

- [ ] **Step 2: Run lint**

```bash
pnpm lint
```

Expected: no errors or warnings.

- [ ] **Step 3: Final commit if any formatting changes**

```bash
git add -A
git commit -m "style: apply biome formatting"
```
