import { avg, count } from "drizzle-orm";
import { roasts } from "@/db/schema";
import { baseProcedure, createTRPCRouter } from "../init";

export const statsRouter = createTRPCRouter({
  getStats: baseProcedure.query(async ({ ctx }) => {
    const result = await ctx.db
      .select({
        totalRoasts: count(),
        avgScore: avg(roasts.score),
      })
      .from(roasts);

    return {
      totalRoasts: result[0]?.totalRoasts ?? 0,
      avgScore: Number(result[0]?.avgScore ?? 0),
    };
  }),
});
