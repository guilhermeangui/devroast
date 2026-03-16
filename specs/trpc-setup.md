# Spec: tRPC com TanStack React Query + Next.js App Router

> **Status:** Ready for implementation
> **Scope:** Camada de API do projeto — substitui Route Handlers ad-hoc por procedures tipadas

---

## Contexto e Objetivo

Atualmente o projeto não possui uma camada de API estruturada. O objetivo é introduzir o **tRPC v11** com o novo client **TanStack React Query** (`@trpc/tanstack-react-query`), aproveitando o App Router do Next.js para:

- Chamar procedures diretamente em Server Components (sem HTTP, sem `fetch`)
- Prefetchar dados no servidor e hidratar o cache para Client Components
- Ter type-safety end-to-end sem geração de código

O padrão adotado é o da documentação oficial de Server Components do tRPC v11:
- https://trpc.io/docs/client/tanstack-react-query/server-components
- https://trpc.io/docs/client/tanstack-react-query/setup

---

## Decisões de Design

- **`@trpc/tanstack-react-query`** (novo client) em vez do `@trpc/react-query` clássico — API mais nativa ao TanStack Query, sem hooks proprietários (`useQuery` e `useMutation` padrão).
- **`createTRPCContext`** em `trpc/client.tsx` para provider de Client Components.
- **`createTRPCOptionsProxy`** em `trpc/server.ts` para prefetch em Server Components — executa direto no processo, sem HTTP.
- **`server-only`** e **`client-only`** para garantir que os dois módulos não sejam importados no ambiente errado.
- **`superjson` não será usado** na fase inicial — o projeto não tem tipos não-serializáveis (Date, Map etc.) que justifiquem o overhead. Pode ser adicionado depois.
- **`HydrateClient` + `prefetch`** como helpers exportados de `trpc/server.ts` para simplificar o padrão de prefetch nas páginas.
- O contexto tRPC (`createTRPCContext`) expõe o `db` do Drizzle — as procedures acessam o banco diretamente, sem camada de repositório adicional.

---

## Estrutura de Arquivos

```
src/
  trpc/
    init.ts           # initTRPC, createTRPCContext com db, helpers de router/procedure
    query-client.ts   # makeQueryClient() com staleTime e dehydrate config
    client.tsx        # 'use client' — TRPCProvider, TRPCReactProvider, useTRPC
    server.ts         # 'server-only' — trpc proxy, getQueryClient, HydrateClient, prefetch, caller
    routers/
      _app.ts         # appRouter raiz + export AppRouter type
      roast.ts        # procedures de roast (submit, getById)
      leaderboard.ts  # procedure de leaderboard (list)
  app/
    layout.tsx        # montar TRPCReactProvider
    api/
      trpc/
        [trpc]/
          route.ts    # fetch adapter — GET + POST handler
```

---

## Contratos das Procedures

### `roast.submit` — mutation

```ts
input: z.object({
  code: z.string().min(10).max(10_000),
  language: languageEnum.optional(),
  roastMode: z.boolean().default(false),
})
output: z.object({ id: z.string().uuid() })
```

Fluxo: recebe código → chama IA (Vercel AI SDK) → insere em `roasts` → retorna `id`.

### `roast.getById` — query

```ts
input: z.object({ id: z.string().uuid() })
output: Roast  // tipo inferido do schema Drizzle
```

### `leaderboard.list` — query

```ts
input: z.object({ limit: z.number().min(1).max(100).default(50) })
output: Roast[]  // ordenado por score ASC
```

---

## Contexto tRPC (`trpc/init.ts`)

O `createTRPCContext` é envolvido em `cache()` do React para garantir uma instância por request:

```ts
import { initTRPC } from '@trpc/server';
import { cache } from 'react';
import { db } from '@/db';

export const createTRPCContext = cache(async () => {
  return { db };
});

const t = initTRPC.context<typeof createTRPCContext>().create();

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;
```

---

## Query Client (`trpc/query-client.ts`)

```ts
import { defaultShouldDehydrateQuery, QueryClient } from '@tanstack/react-query';

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30 * 1000 },
      dehydrate: {
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === 'pending',
      },
    },
  });
}
```

O `shouldDehydrateQuery` estendido permite hidratar queries ainda pendentes — essencial para o padrão de streaming do App Router.

---

## Client Provider (`trpc/client.tsx`)

```ts
'use client';

export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>();

export function TRPCReactProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [httpBatchLink({ url: getUrl() })]
    })
  );
  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {children}
      </TRPCProvider>
    </QueryClientProvider>
  );
}
```

`getUrl()` resolve para `''` no browser, `https://$VERCEL_URL` na Vercel, ou `http://localhost:3000` em dev.

---

## Server Proxy + Helpers (`trpc/server.ts`)

```ts
import 'server-only';

export const getQueryClient = cache(makeQueryClient);

export const trpc = createTRPCOptionsProxy({
  ctx: createTRPCContext,
  router: appRouter,
  queryClient: getQueryClient,
});

export const caller = createCallerFactory(appRouter)(createTRPCContext);

export function HydrateClient({ children }: { children: React.ReactNode }) {
  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
      {children}
    </HydrationBoundary>
  );
}

export function prefetch<T extends ReturnType<TRPCQueryOptions<any>>>(opts: T) {
  const qc = getQueryClient();
  if (opts.queryKey[1]?.type === 'infinite') {
    void qc.prefetchInfiniteQuery(opts as any);
  } else {
    void qc.prefetchQuery(opts);
  }
}
```

---

## Padrões de Uso

### Server Component com prefetch (streaming)

```tsx
// app/roast/[id]/page.tsx
import { HydrateClient, prefetch, trpc } from '@/trpc/server';

export default function RoastPage({ params }: { params: { id: string } }) {
  prefetch(trpc.roast.getById.queryOptions({ id: params.id }));
  return (
    <HydrateClient>
      <RoastResult id={params.id} />
    </HydrateClient>
  );
}
```

### Client Component consumindo o cache

```tsx
'use client';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useTRPC } from '@/trpc/client';

export function RoastResult({ id }: { id: string }) {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(trpc.roast.getById.queryOptions({ id }));
  return <div>{data.roastQuote}</div>;
}
```

### Server Component com dado direto (via caller)

```tsx
// Quando o dado só é necessário no servidor
import { caller } from '@/trpc/server';
const roast = await caller.roast.getById({ id });
```

---

## Dependências

| Pacote | Versão | Motivo |
|--------|--------|--------|
| `@trpc/server` | ^11.x | Core do tRPC — router, procedures, context |
| `@trpc/client` | ^11.x | Cliente HTTP + links |
| `@trpc/tanstack-react-query` | ^11.x | Integração com TanStack Query (novo client) |
| `@tanstack/react-query` | ^5.x | QueryClient, hooks, HydrationBoundary |
| `server-only` | latest | Impede importação de `trpc/server.ts` no cliente |
| `client-only` | latest | Impede importação de `trpc/client.tsx` no servidor |
| `zod` | ^3.x | Validação de input das procedures |

```bash
pnpm add @trpc/server @trpc/client @trpc/tanstack-react-query @tanstack/react-query zod server-only client-only
```

---

## Checklist de Implementação

### Setup da infra tRPC

- [ ] Instalar dependências acima
- [ ] Criar `src/trpc/init.ts` com `createTRPCContext` (expõe `db`), `baseProcedure`, `createTRPCRouter`, `createCallerFactory`
- [ ] Criar `src/trpc/query-client.ts` com `makeQueryClient`
- [ ] Criar `src/trpc/client.tsx` com `TRPCReactProvider`, `useTRPC`
- [ ] Criar `src/trpc/server.ts` com `trpc` proxy, `getQueryClient`, `HydrateClient`, `prefetch`, `caller`
- [ ] Criar `src/app/api/trpc/[trpc]/route.ts` com o fetch adapter
- [ ] Montar `<TRPCReactProvider>` em `src/app/layout.tsx`

### Routers

- [ ] Criar `src/trpc/routers/roast.ts` com procedures `submit` e `getById`
- [ ] Criar `src/trpc/routers/leaderboard.ts` com procedure `list`
- [ ] Criar `src/trpc/routers/_app.ts` compondo o `appRouter` e exportando `AppRouter`

### Integração nas páginas

- [ ] Migrar `/roast/[id]/page.tsx` para usar `prefetch` + `HydrateClient` + `useSuspenseQuery`
- [ ] Migrar `/leaderboard/page.tsx` para usar `prefetch` + `HydrateClient` + `useSuspenseQuery`
- [ ] Migrar submit de código (homepage) para usar `useMutation(trpc.roast.submit.mutationOptions())`

### Qualidade

- [ ] Rodar `pnpm lint` e `pnpm format`
- [ ] Verificar que `trpc/server.ts` não é importável no cliente (Next.js lança erro se `server-only` for violado)
