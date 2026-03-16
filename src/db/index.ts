import { drizzle } from "drizzle-orm/node-postgres";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

/**
 * Instância singleton do client Drizzle.
 *
 * Sem `schema` no construtor — queries são escritas com a API
 * de select/insert/update/delete do Drizzle (SQL-first), sem
 * usar db.query ou relations nativas.
 */
export const db = drizzle(process.env.DATABASE_URL);
