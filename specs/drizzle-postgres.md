# Spec: Drizzle ORM + PostgreSQL + Docker Compose

Especificação completa para persistência de dados no DevRoast — incluindo schema, migrations, variáveis de ambiente e scripts.

---

## Contexto e Decisões de Design

- **Submissões são anônimas** — nenhum usuário autenticado; o código é enviado publicamente sem vínculo a conta alguma.
- **Leaderboard é público e automático** — toda submissão aparece no ranking sem opt-in do autor.
- **IA de roast é agnóstica de provider** — toda comunicação com LLM passa pelo **Vercel AI SDK** (`ai`), abstraindo o provider subjacente (OpenAI, Anthropic, Google, etc.).
- **ORM:** Drizzle ORM com driver `postgres` (node-postgres).
- **Banco:** PostgreSQL 16 via Docker Compose para desenvolvimento local.
- **Migrations:** gerenciadas pelo Drizzle Kit (`drizzle-kit`).

---

## 1. Estrutura de Arquivos

```
devroast/
├── docker-compose.yml
├── .env.local                    # não comitar
├── .env.example                  # comitar
├── drizzle.config.ts
└── src/
    └── db/
        ├── index.ts              # instância do client
        ├── schema/
        │   ├── index.ts          # re-exporta tudo
        │   ├── roasts.ts         # tabela principal
        │   └── enums.ts          # enums compartilhados
        └── migrations/           # gerado pelo drizzle-kit
```

---

## 2. Docker Compose

**`docker-compose.yml`**

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: devroast_postgres
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

---

## 3. Variáveis de Ambiente

**`.env.example`**

```dotenv
# ── Banco de dados ──────────────────────────────────────────────
POSTGRES_USER=devroast
POSTGRES_PASSWORD=devroast
POSTGRES_DB=devroast
DATABASE_URL="postgresql://devroast:devroast@localhost:5432/devroast"

# ── Vercel AI SDK ───────────────────────────────────────────────
# Configure o provider desejado. Apenas uma das variáveis abaixo
# é necessária dependendo do provider escolhido em runtime.
# Exemplos:
# OPENAI_API_KEY=sk-...
# ANTHROPIC_API_KEY=sk-ant-...
# GOOGLE_GENERATIVE_AI_API_KEY=...
```

> `DATABASE_URL` é a única variável consumida diretamente pelo Drizzle.  
> As chaves de IA são lidas automaticamente pelo Vercel AI SDK conforme o provider instanciado.

---

## 4. Schema

### 4.1 Enums

**`src/db/schema/enums.ts`**

```typescript
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
```

---

### 4.2 Tabela `roasts`

**`src/db/schema/roasts.ts`**

A tabela central do sistema. Cada linha representa uma submissão anônima de código e o resultado completo do roast gerado pela IA.

```typescript
import { integer, jsonb, numeric, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { issueSeverityEnum, languageEnum, verdictEnum } from "./enums";

/**
 * Tipo de um issue individual retornado pela IA.
 */
export type RoastIssue = {
  severity: "critical" | "warning" | "good";
  title: string;
  description: string;
};

export const roasts = pgTable("roasts", {
  // ── Identidade ──────────────────────────────────────────────────
  id: uuid("id").primaryKey().defaultRandom(),

  // ── Submissão ───────────────────────────────────────────────────
  /** Código enviado pelo usuário. Sem limite de tamanho via TEXT. */
  code: text("code").notNull(),

  /** Linguagem detectada ou informada. Exibida no leaderboard e resultados. */
  language: languageEnum("language").notNull().default("other"),

  /** Número de linhas do código submetido. Exibido no leaderboard ("X lines"). */
  lineCount: integer("line_count").notNull().default(0),

  /** Se true, o roast foi gerado com "maximum sarcasm" (Roast Mode ligado). */
  roastMode: integer("roast_mode", { mode: "boolean" }).notNull().default(false),

  // ── Resultado do Roast ──────────────────────────────────────────
  /**
   * Score de 0.0 a 10.0 gerado pela IA.
   * Precision 4, scale 2 → suporta valores como 3.50, 1.20, 10.00.
   * Exibido no Score Ring e no leaderboard.
   */
  score: numeric("score", { precision: 4, scale: 2 }).notNull(),

  /**
   * Frase de abertura do roast — citação exibida em destaque na tela
   * de resultados e na OG Image.
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
   * Cada item tem: { severity, title, description }
   * Exibidos nos Issue Cards da seção "detailed_analysis".
   */
  issues: jsonb("issues").$type<RoastIssue[]>().notNull().default([]),

  /**
   * Sugestão de melhoria em formato diff (unified diff ou texto livre).
   * Exibida na seção "suggested_fix" da tela de resultados.
   */
  suggestedFix: text("suggested_fix"),

  // ── Timestamps ──────────────────────────────────────────────────
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Roast = typeof roasts.$inferSelect;
export type NewRoast = typeof roasts.$inferInsert;
```

**Observação sobre o leaderboard:** o ranking é ordenado por `score ASC` (menor score = mais vergonhoso = posição mais alta). Toda submissão aparece automaticamente — não há coluna de visibilidade ou opt-in.

---

### 4.3 Re-exportações

**`src/db/schema/index.ts`**

```typescript
export * from "./enums";
export * from "./roasts";
```

---

## 5. Client Drizzle

**`src/db/index.ts`**

```typescript
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

/**
 * Instância singleton do client Drizzle.
 * DATABASE_URL deve estar definida em .env.local.
 */
export const db = drizzle(process.env.DATABASE_URL!, { schema });
```

---

## 6. Drizzle Config

**`drizzle.config.ts`** (raiz do projeto)

```typescript
import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema/index.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

---

## 7. Scripts npm

Adicionar ao `package.json`:

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate":  "drizzle-kit migrate",
    "db:push":     "drizzle-kit push",
    "db:studio":   "drizzle-kit studio",
    "db:up":       "docker compose up -d",
    "db:down":     "docker compose down"
  }
}
```

| Script | Descrição |
|---|---|
| `pnpm db:up` | Sobe o container Postgres em background |
| `pnpm db:generate` | Gera migration SQL a partir do schema |
| `pnpm db:migrate` | Aplica as migrations pendentes |
| `pnpm db:push` | Push direto do schema sem migration (dev rápido) |
| `pnpm db:studio` | Abre o Drizzle Studio no browser |
| `pnpm db:down` | Para e remove o container |

---

## 8. Pacotes a Instalar

```bash
# Runtime
pnpm add drizzle-orm pg ai

# Dev
pnpm add -D drizzle-kit @types/pg
```

| Pacote | Motivo |
|---|---|
| `drizzle-orm` | ORM principal |
| `pg` | Driver node-postgres |
| `ai` | Vercel AI SDK — abstrai o provider de LLM |
| `drizzle-kit` | CLI de migrations, push e studio |
| `@types/pg` | Tipos TypeScript para o driver `pg` |

---

## 9. Fluxo de Dados por Funcionalidade

### 9.1 Submissão de código (`Screen 1 → Screen 2`)

1. Usuário cola código no editor e clica em `$ roast_my_code`.
2. Server Action / Route Handler recebe `{ code, language, roastMode }`.
3. Vercel AI SDK (`generateObject` ou `streamObject`) envia o código para o LLM e recebe:
   - `score` (0–10)
   - `roastQuote`
   - `verdict`
   - `issues[]` (com `severity`, `title`, `description`)
   - `suggestedFix`
4. Drizzle insere o registro em `roasts` e retorna o `id`.
5. Usuário é redirecionado para `/roast/[id]` (Screen 2).

### 9.2 Tela de resultados (`Screen 2`)

- `SELECT * FROM roasts WHERE id = $1`
- Exibe: Score Ring, `roastQuote`, `verdict` badge, `language`, `lineCount`, `issues[]`, `suggestedFix` (diff view).

### 9.3 Leaderboard (`Screen 3`)

- `SELECT id, score, verdict, language, lineCount, code, createdAt FROM roasts ORDER BY score ASC LIMIT 50`
- Toda submissão aparece automaticamente (sem opt-in).
- Colunas exibidas: `#` (rank), `score`, `code` (preview), `lang`, `lines`.

### 9.4 OG Image (`Screen 4`)

- Gerado por `next/og` a partir dos campos `score`, `verdict`, `roastQuote`, `language`, `lineCount` do registro correspondente.

---

## 10. Índices Recomendados

```typescript
import { index } from "drizzle-orm/pg-core";

// No pgTable, adicionar como terceiro argumento:
(table) => [
  index("roasts_score_idx").on(table.score),       // leaderboard ORDER BY score
  index("roasts_created_at_idx").on(table.createdAt), // paginação cronológica
]
```

---

## 11. To-dos de Implementação

### Setup inicial

- [ ] Criar `docker-compose.yml` conforme seção 2
- [ ] Criar `.env.example` conforme seção 3
- [ ] Copiar `.env.example` → `.env.local` e preencher credenciais locais
- [ ] Adicionar `.env.local` ao `.gitignore` (verificar se já está)
- [ ] Instalar pacotes: `pnpm add drizzle-orm pg ai && pnpm add -D drizzle-kit @types/pg`
- [ ] Adicionar scripts `db:*` ao `package.json`

### Schema e migrations

- [ ] Criar `src/db/schema/enums.ts` com os três enums
- [ ] Criar `src/db/schema/roasts.ts` com a tabela `roasts`
- [ ] Criar `src/db/schema/index.ts` re-exportando tudo
- [ ] Criar `src/db/index.ts` com o client Drizzle
- [ ] Criar `drizzle.config.ts` na raiz do projeto
- [ ] Subir o Postgres: `pnpm db:up`
- [ ] Gerar migration inicial: `pnpm db:generate`
- [ ] Aplicar migration: `pnpm db:migrate`
- [ ] Verificar no Drizzle Studio: `pnpm db:studio`

### Integração com IA (Vercel AI SDK)

- [ ] Definir o schema de output esperado da IA (Zod) compatível com `RoastIssue[]`
- [ ] Criar helper/service `src/lib/roast-ai.ts` que chama o LLM via `ai` e retorna o objeto tipado
- [ ] Garantir que o provider escolhido está configurado via env var (sem hardcode de provider)

### Server Actions / Route Handlers

- [ ] `POST /api/roast` — recebe código, chama IA, persiste no banco, retorna `id`
- [ ] `GET /api/roast/[id]` — busca roast por id para a tela de resultados
- [ ] `GET /api/leaderboard` — busca top N roasts ordenados por score ASC

### OG Image

- [ ] `GET /og/[id]` — rota `next/og` que renderiza a Screen 4 com dados do roast

### Validações

- [ ] Limite mínimo/máximo de caracteres para o campo `code` (evitar abuso)
- [ ] Sanitização do código antes de enviar ao LLM (remover dados sensíveis óbvios)
