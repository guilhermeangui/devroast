# Database Patterns

Conventions for the database layer (`src/db/`).

## Client

The Drizzle client is instantiated **without** passing the schema:

```ts
// src/db/index.ts
export const db = drizzle(process.env.DATABASE_URL);
```

### Why no schema?

Passing `{ schema }` to the constructor enables the Relational Query API (`db.query.*`), which only adds value when multiple tables have `relations()` defined between them. The project currently has a single table (`roasts`) with no foreign keys, so the Core API is identical in ergonomia and there's nothing to gain.

**When to add schema:** if the data model grows with related tables (e.g. `users`, `comments`) and joins become frequent, add `{ schema }` to the constructor and define `relations()` at that point.

## Query Style — Core API (SQL-first)

Always use the Core API. Do not use `db.query.*` (Relational API) until schema is added.

```ts
// SELECT
const result = await db.select().from(roasts).where(eq(roasts.id, id));

// INSERT
const [inserted] = await db.insert(roasts).values(data).returning();

// Aggregates
const [stats] = await db
  .select({ total: count(), avg: avg(roasts.score) })
  .from(roasts);
```

## Schema

- One file per concern: `schema/enums.ts`, `schema/roasts.ts`, `schema/index.ts` (re-exports).
- All schema files re-exported from `schema/index.ts` — always import from `@/db/schema`.
- Use `pgEnum` for any column with a fixed set of values.
- Infer TypeScript types from the schema — never define them manually:

```ts
export type Roast = typeof roasts.$inferSelect;
export type NewRoast = typeof roasts.$inferInsert;
```

## Migrations

Managed by Drizzle Kit. Never edit migration files manually.

```bash
pnpm db:generate   # generate SQL from schema changes
pnpm db:migrate    # apply pending migrations
pnpm db:push       # push schema directly (dev only, no migration file)
pnpm db:studio     # open Drizzle Studio
```
