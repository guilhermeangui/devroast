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
