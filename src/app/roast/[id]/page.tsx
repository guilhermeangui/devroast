import type { Metadata } from "next";
import { Suspense } from "react";
import { RoastResult } from "./roast-result";
import { db } from "@/db";
import { roasts } from "@/db/schema";
import { eq } from "drizzle-orm";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  const [roast] = await db
    .select({
      score: roasts.score,
      verdict: roasts.verdict,
      roastQuote: roasts.roastQuote,
    })
    .from(roasts)
    .where(eq(roasts.id, id))
    .limit(1);

  if (!roast) {
    return { title: "Roast Result | devroast" };
  }

  const title = `${roast.score}/10 — ${roast.verdict} | devroast`;
  const description = `"${roast.roastQuote}"`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default function RoastResultPage({ params }: Props) {
  return (
    <main className="mx-auto max-w-5xl px-20 py-10">
      <Suspense fallback={<RoastResultSkeleton />}>
        <RoastResult params={params} />
      </Suspense>
    </main>
  );
}

function RoastResultSkeleton() {
  return (
    <div className="flex flex-col gap-10 animate-pulse">
      {/* Score Hero skeleton */}
      <section className="flex items-center gap-12">
        <div className="size-[180px] shrink-0 rounded-full border-4 border-border-primary" />
        <div className="flex flex-1 flex-col gap-4">
          <div className="h-5 w-32 rounded-sm bg-bg-elevated" />
          <div className="h-6 w-3/4 rounded-sm bg-bg-elevated" />
          <div className="h-4 w-40 rounded-sm bg-bg-elevated" />
        </div>
      </section>

      <div className="h-px bg-border-primary" />

      {/* Code block skeleton */}
      <section className="flex flex-col gap-4">
        <div className="h-4 w-36 rounded-sm bg-bg-elevated" />
        <div className="h-64 w-full rounded-sm border border-border-primary bg-bg-input" />
      </section>

      <div className="h-px bg-border-primary" />

      {/* Issues grid skeleton */}
      <section className="flex flex-col gap-6">
        <div className="h-4 w-40 rounded-sm bg-bg-elevated" />
        <div className="grid grid-cols-2 gap-5">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="flex flex-col gap-3 border border-border-primary p-5"
            >
              <div className="h-4 w-16 rounded-sm bg-bg-elevated" />
              <div className="h-4 w-3/4 rounded-sm bg-bg-elevated" />
              <div className="h-10 w-full rounded-sm bg-bg-elevated" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
