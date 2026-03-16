import "server-only";

import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { cache } from "react";
import { createCallerFactory, createTRPCContext } from "./init";
import { makeQueryClient } from "./query-client";
import { appRouter } from "./routers/_app";

// QueryClient estável por request via React cache
export const getQueryClient = cache(makeQueryClient);

// Proxy para prefetch em Server Components — executa direto no processo, sem HTTP
export const trpc = createTRPCOptionsProxy({
  ctx: createTRPCContext,
  router: appRouter,
  queryClient: getQueryClient,
});

// Caller direto para Server Components que só precisam do dado no servidor
export const caller = createCallerFactory(appRouter)(createTRPCContext);

// Helper: HydrationBoundary pré-configurado com o QueryClient do request atual
export function HydrateClient({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {children}
    </HydrationBoundary>
  );
}

// Helper: inicia prefetch no QueryClient sem bloquear o render.
// O cast é necessário porque TRPCQueryKeyWithoutPrefix (mutable) não é atribuível
// a readonly unknown[] — incompatibilidade de variância entre o tRPC e o TanStack Query.
// biome-ignore lint/suspicious/noExplicitAny: incompatibilidade de variância entre tRPC e TanStack Query
export function prefetch(queryOptions: any) {
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(queryOptions);
}
