import { createTRPCRouter } from "../init";
import { leaderboardRouter } from "./leaderboard";
import { statsRouter } from "./stats";

export const appRouter = createTRPCRouter({
  stats: statsRouter,
  leaderboard: leaderboardRouter,
});

export type AppRouter = typeof appRouter;
