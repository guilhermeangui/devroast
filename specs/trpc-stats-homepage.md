# Spec: tRPC Stats na Homepage

> **Status:** Implemented
> **Scope:** Setup inicial do tRPC + procedure `stats.getStats` + métricas animadas na homepage

---

## Contexto e Objetivo

Primeira feature real integrada ao tRPC: substituir os valores hardcoded de métricas na homepage (`"2,847 codes roasted"` e `"avg score: 4.2/10"`) por dados reais do banco, com animação de contagem via `@number-flow/react`.

---

## Descoberta: `drizzle(url)` vs `drizzle(url, { schema })`

Durante a análise do projeto foi identificado que o `db` é instanciado sem passar o schema:

```ts
// src/db/index.ts — padrão atual
export const db = drizzle(process.env.DATABASE_URL);
```

### O que muda com o schema

Passar `{ schema }` habilita a **Relational Query API** (`db.query.*`), que permite joins declarativos via `relations()`:

```ts
// Só disponível COM schema
db.query.roasts.findMany({ with: { comments: true } })
```

Sem schema, apenas a **Core API** (SQL-first) está disponível:

```ts
// Disponível sempre
db.select().from(roasts).where(eq(roasts.id, id))
```

### Recomendação: manter sem schema por ora

O projeto tem **uma única tabela** (`roasts`) sem relações. A Relational API só agrega valor com múltiplas tabelas relacionadas via `relations()`. Para queries simples como `COUNT` e `AVG`, a Core API é idêntica em ergonomia.

**Ação futura:** adicionar `{ schema }` e definir `relations()` somente quando o modelo de dados crescer com tabelas relacionadas.

---

## Arquitetura

```
src/
  trpc/
    init.ts                    # initTRPC + createTRPCContext (expõe db) + helpers
    query-client.ts            # makeQueryClient() com staleTime e dehydrate config
    client.tsx                 # 'use client' — TRPCReactProvider, useTRPC
    server.ts                  # 'server-only' — trpc proxy, getQueryClient, HydrateClient, prefetch, caller
    routers/
      _app.ts                  # appRouter raiz + AppRouter type
      stats.ts                 # procedure stats.getStats (COUNT + AVG)
  app/
    layout.tsx                 # MODIFICADO — monta TRPCReactProvider
    page.tsx                   # MODIFICADO — Suspense + HydrateClient + prefetch
    components/
      home-stats.tsx           # 'use client' — useSuspenseQuery + NumberFlow
      home-stats-skeleton.tsx  # skeleton estático para loading state
    api/
      trpc/
        [trpc]/
          route.ts             # fetch adapter — GET + POST
```

---

## Procedure `stats.getStats`

```ts
// src/trpc/routers/stats.ts
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
})
```

---

## Padrão de Renderização na Homepage

```
page.tsx (Server Component)
  prefetch(trpc.stats.getStats.queryOptions())   ← dispara query no servidor
  └── <HydrateClient>
        └── <Suspense fallback={<HomeStatsSkeleton />}>
              └── <HomeStats />  (Client Component)
                    useSuspenseQuery(trpc.stats.getStats.queryOptions())
                    <NumberFlow value={totalRoasts} />
                    <NumberFlow value={avgScore} format={{ maximumFractionDigits: 1 }} suffix="/10" />
```

O `prefetch` sem `await` inicia a query no servidor sem bloquear o HTML — o streaming do App Router entrega o resultado ao client assim que disponível. O `useSuspenseQuery` no Client Component suspende enquanto aguarda, exibindo o skeleton.

---

## Dependências Adicionadas

| Pacote | Motivo |
|--------|--------|
| `@trpc/server` | Core do tRPC — router, procedures, context |
| `@trpc/client` | Cliente HTTP + links |
| `@trpc/tanstack-react-query` | Integração com TanStack Query (novo client v11) |
| `@tanstack/react-query` | QueryClient, hooks, HydrationBoundary |
| `zod` | Validação de input das procedures |
| `server-only` | Impede importação de `trpc/server.ts` no cliente |
| `client-only` | Impede importação de `trpc/client.tsx` no servidor |
| `@number-flow/react` | Animação de contagem do zero para o valor real |
