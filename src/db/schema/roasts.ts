import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { languageEnum, verdictEnum } from "./enums";

/**
 * Tipo de um issue individual retornado pela IA.
 * Serializado como JSONB na coluna `issues`.
 */
export type RoastIssue = {
  severity: "critical" | "warning" | "good";
  title: string;
  description: string;
};

/**
 * Tabela central do DevRoast.
 *
 * Cada linha representa uma submissão anônima de código e o resultado
 * completo do roast gerado pela IA. Não há FK para usuário — submissões
 * são sempre públicas e anônimas.
 *
 * O leaderboard é ordenado por `score ASC` (menor = mais vergonhoso);
 * toda submissão aparece automaticamente, sem opt-in.
 */
export const roasts = pgTable(
  "roasts",
  {
    // ── Identidade ────────────────────────────────────────────────
    id: uuid("id").primaryKey().defaultRandom(),

    // ── Submissão ─────────────────────────────────────────────────
    /** Código enviado pelo usuário. TEXT sem limite de tamanho. */
    code: text("code").notNull(),

    /** Linguagem detectada ou informada. Exibida no leaderboard e nos resultados. */
    language: languageEnum("language").notNull().default("other"),

    /** Número de linhas do código submetido. Exibido no leaderboard ("X lines"). */
    lineCount: integer("line_count").notNull().default(0),

    /** Se true, o roast foi gerado com "maximum sarcasm" (Roast Mode ligado). */
    roastMode: boolean("roast_mode").notNull().default(false),

    // ── Resultado do Roast ────────────────────────────────────────
    /**
     * Score de 0.0 a 10.0 gerado pela IA.
     * precision 4, scale 2 → ex.: 3.50, 1.20, 10.00
     * Exibido no Score Ring e no leaderboard.
     */
    score: numeric("score", { precision: 4, scale: 2 }).notNull(),

    /**
     * Frase de abertura do roast.
     * Exibida em destaque na tela de resultados e na OG Image.
     * Ex.: "this code looks like it was written during a power outage... in 2005."
     */
    roastQuote: text("roast_quote").notNull(),

    /**
     * Veredicto categórico derivado do score.
     * Exibido no badge da tela de resultados e na OG Image.
     */
    verdict: verdictEnum("verdict").notNull(),

    /**
     * Issues identificadas pela IA — array serializado em JSONB.
     * Cada item: { severity, title, description }
     * Exibidos nos Issue Cards da seção "detailed_analysis".
     */
    issues: jsonb("issues").$type<RoastIssue[]>().notNull().default([]),

    /**
     * Sugestão de melhoria em formato diff (unified diff ou texto livre).
     * Exibida na seção "suggested_fix" da tela de resultados.
     */
    suggestedFix: text("suggested_fix"),

    // ── Timestamps ────────────────────────────────────────────────
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // Leaderboard: ORDER BY score ASC
    index("roasts_score_idx").on(table.score),
    // Paginação cronológica
    index("roasts_created_at_idx").on(table.createdAt),
  ],
);

export type Roast = typeof roasts.$inferSelect;
export type NewRoast = typeof roasts.$inferInsert;
