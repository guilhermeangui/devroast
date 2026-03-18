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
