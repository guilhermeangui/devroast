import { pgEnum } from "drizzle-orm/pg-core";

/**
 * Linguagem de programação detectada/informada na submissão.
 * Exibida no leaderboard (coluna "lang") e na tela de resultados.
 */
export const languageEnum = pgEnum("language", [
  "javascript",
  "typescript",
  "python",
  "rust",
  "go",
  "java",
  "c",
  "cpp",
  "csharp",
  "php",
  "ruby",
  "swift",
  "kotlin",
  "sql",
  "shell",
  "other",
]);

/**
 * Veredicto geral do roast — derivado do score e exibido na OG Image
 * e no badge da tela de resultados.
 *
 * Mapeamento sugerido:
 *   0.0–2.9 → needs_serious_help
 *   3.0–4.9 → pretty_bad
 *   5.0–6.9 → could_be_worse
 *   7.0–8.9 → not_terrible
 *   9.0–10  → surprisingly_good
 */
export const verdictEnum = pgEnum("verdict", [
  "needs_serious_help",
  "pretty_bad",
  "could_be_worse",
  "not_terrible",
  "surprisingly_good",
]);

/**
 * Severidade de cada issue apontada na análise detalhada.
 * Exibida nos Issue Cards da tela de resultados.
 */
export const issueSeverityEnum = pgEnum("issue_severity", [
  "critical",
  "warning",
  "good",
]);
