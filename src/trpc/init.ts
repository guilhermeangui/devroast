import { initTRPC } from "@trpc/server";
import { cache } from "react";
import { db } from "@/db";

/**
 * Context criado uma vez por request (via React cache).
 * Expõe o client Drizzle para todas as procedures.
 */
export const createTRPCContext = cache(async () => {
  return { db };
});

const t = initTRPC.context<typeof createTRPCContext>().create();

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;
