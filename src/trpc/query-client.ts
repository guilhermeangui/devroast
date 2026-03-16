import {
  defaultShouldDehydrateQuery,
  QueryClient,
} from "@tanstack/react-query";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Com SSR, evitar refetch imediato no cliente
        staleTime: 30 * 1000,
      },
      dehydrate: {
        // Inclui queries ainda pendentes no dehydrate —
        // permite hidratar promises em streaming pelo App Router
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
      },
    },
  });
}
