# Spec: Roast Submission

> **Status:** Ready for implementation
> **Scope:** `src/trpc/routers/roast.ts`, `src/trpc/routers/_app.ts`, `src/app/home-client.tsx`, `src/app/roast/[id]/page.tsx`, `.env.local`, `.env.example`, `package.json`

---

## Contexto e Objetivo

Hoje a página de home já tem o `CodeEditor` (com detecção de linguagem), o `Toggle` de roast mode e o botão `$ roast_my_code` — mas o botão não faz nada. A página `/roast/[id]` também existe, mas usa dados mockados.

O objetivo é fechar esse loop: o usuário cola código, clica no botão, a IA gera a análise, o resultado é salvo no DB e o usuário é redirecionado para a página de resultado com os dados reais.

**Decisões de design:**
- Tudo vai por tRPC, como o resto do projeto.
- A chamada à IA é síncrona dentro da mutation (a request fica aberta ~5–15s). `claude-3-5-haiku` é rápido o suficiente para isso ser aceitável.
- O `verdict` **não** é gerado pela IA — é derivado do `score` no servidor. Isso evita inconsistências entre o que a IA diz e o que o DB armazena.
- A parte de "share roast" **não** será implementada nesta feature.
- `generateObject` está deprecated no AI SDK v6. Usamos `generateText` com `Output.object({ schema })`.

---

## Pesquisa / Opções Consideradas

### Abordagem do submit

| Opção | Descrição | Decisão |
|-------|-----------|---------|
| **A — tRPC mutation síncrona** | Mutation chama IA + salva + retorna id. Client redireciona. | ✅ Escolhida |
| B — Job assíncrono com polling | Submit cria registro pending; IA roda em background; página faz polling. | Rejeitada — complexidade desnecessária para o scope |
| C — Server Action direto | Next.js Server Action com `redirect()` nativo, sem tRPC. | Rejeitada — quebra convenção do projeto |

### API do AI SDK

`generateObject` está **deprecated** no AI SDK v6. A API correta é:

```typescript
import { generateText, Output } from 'ai';

const { output } = await generateText({
  model: anthropic('claude-3-5-haiku-20241022'),
  output: Output.object({ schema: roastOutputSchema }),
  prompt: buildPrompt(code, language, roastMode),
});
```

---

## Arquitetura / Estrutura

### Fluxo de dados

```
[Home Page — Server Component]
  └─ <HydrateClient>
       └─ <SubmitForm />  ← "use client"
            CodeEditor (código + língua)
            Toggle (roastMode)
            Button "$ roast_my_code"
                 |
                 | useMutation(trpc.roast.submit)
                 v
          [tRPC: roast.submit]
            input: { code, language, roastMode }
            1. generateText + Output.object(roastOutputSchema)
            2. score → verdict (função pura)
            3. db.insert(roasts).returning()
            4. return { id }
                 |
                 | onSuccess: router.push(`/roast/${id}`)
                 v
          [/roast/[id] — Server Component]
            caller.roast.getById(id)
            Renderiza resultado real (shiki highlight)
```

### Schema Zod do Output da IA

```typescript
const roastOutputSchema = z.object({
  score: z.number().min(0).max(10),
  roastQuote: z.string(),
  issues: z.array(z.object({
    severity: z.enum(["critical", "warning", "good"]),
    title: z.string(),
    description: z.string(),
  })).min(2).max(6),
  suggestedFix: z.string().nullable(),
  language: z.enum([
    "javascript", "typescript", "python", "rust", "go", "java",
    "c", "cpp", "csharp", "php", "ruby", "swift", "kotlin",
    "sql", "shell", "other",
  ]),
});
```

### Derivação do verdict

```typescript
function scoreToVerdict(score: number): typeof verdictEnum.enumValues[number] {
  if (score < 3.0) return "needs_serious_help";
  if (score < 5.0) return "pretty_bad";
  if (score < 7.0) return "could_be_worse";
  if (score < 9.0) return "not_terrible";
  return "surprisingly_good";
}
```

### Prompt da IA

O prompt varia conforme `roastMode`:

- **Normal:** "Provide an honest, technical code review..."
- **Roast mode:** "You are a brutally sarcastic senior engineer. Roast this code mercilessly..."

O campo `roastQuote` deve ser uma frase de abertura sarcastica/direta que resume a qualidade do código (ex: `"this code looks like it was written during a power outage... in 2005."`).

O campo `suggestedFix` deve ser um **unified diff como string de texto livre** (ex: linhas começando com `+`, `-`, ` `). Ele é renderizado como texto pré-formatado na UI — **não** é parseado em objetos `{type, code}`. A seção `suggested_fix` na página de resultado deve ser simplificada para exibir o texto diretamente em `<pre>` com a estilização atual de `<DiffLine>` descartada a favor de um bloco simples. Se `suggestedFix` for `null`, a seção inteira não é renderizada.

---

## Componentes / Arquivos a Criar ou Modificar

| Arquivo | Tipo | Responsabilidade |
|---------|------|-----------------|
| `src/trpc/routers/roast.ts` | NOVO | Router com `submit` (mutation) e `getById` (query) |
| `src/trpc/routers/_app.ts` | MODIFICAR | Registra `roastRouter` |
| `src/app/home-client.tsx` | MODIFICAR | `ActionsBar` conectada via `useMutation`; estado de loading no botão |
| `src/app/roast/[id]/page.tsx` | MODIFICAR | Substitui mock por `caller.roast.getById(id)`; trata `notFound()` |
| `.env.example` | MODIFICAR | Adiciona `ANTHROPIC_API_KEY=` |
| `.env.local` | MODIFICAR | Adiciona chave real (não commitada) |

### Notas sobre `home-client.tsx`

- O `CodeEditor` já expõe `onChange?: (code: string, language: string) => void` — usar isso para capturar código e linguagem em state.
- O `Toggle` precisa ter seu estado controlado para passar `roastMode` para a mutation.
- O `Button` deve ficar `disabled` e exibir um texto alternativo (`$ roasting...`) enquanto a mutation está pendente.
- Ao receber o `id` no `onSuccess`, usar `useRouter().push()` do Next.js para navegar.

### Notas sobre `roast/[id]/page.tsx`

- Remover o objeto `roastData` mockado.
- Chamar `caller.roast.getById(id)`. Se retornar `null`, chamar `notFound()` do Next.js.
- O `score` vem como `string` do Drizzle (tipo `numeric`) — fazer `Number(data.score)` antes de usar em comparações e no `ScoreRing`.
- O campo `suggestedFix` pode ser `null` — renderizar a seção apenas se não for `null`.

---

## Dependências

| Pacote | Versão | Motivo |
|--------|--------|--------|
| `ai` | `^4.x` ou `^5.x` (verificar latest) | Vercel AI SDK core (`generateText`, `Output`) |
| `@ai-sdk/anthropic` | latest compatível | Provider Anthropic para o AI SDK |

> **Nota:** O projeto já usa `zod@^4.3.6`. O AI SDK v4+ usa Zod internamente. Antes de instalar, verificar: `npm info ai version` e checar se a versão mais recente é compatível com Zod v4. Se houver conflito de peer deps, usar `pnpm add ai@latest @ai-sdk/anthropic@latest` e checar o output de warnings.

---

## Checklist de Implementação

- [ ] Instalar dependências: `pnpm add ai @ai-sdk/anthropic`
- [ ] Adicionar `ANTHROPIC_API_KEY=` ao `.env.example`
- [ ] Adicionar chave real ao `.env.local`
- [ ] Criar `src/trpc/routers/roast.ts` com:
  - [ ] Schema Zod `roastOutputSchema`
  - [ ] Função pura `scoreToVerdict`
  - [ ] Função `buildPrompt(code, language, roastMode)`
  - [ ] Procedure `submit` (mutation): chama IA → deriva verdict → insere no DB → retorna `{ id }`
  - [ ] Procedure `getById` (query): busca roast por id, retorna `null` se não encontrar
- [ ] Registrar `roastRouter` em `src/trpc/routers/_app.ts`
- [ ] Modificar `src/app/home-client.tsx`:
  - [ ] Estado `code` e `language` capturado via `CodeEditor.onChange`
  - [ ] Estado `roastMode` controlado pelo `Toggle`
  - [ ] `useMutation` para `trpc.roast.submit`
  - [ ] `Button` em loading state durante a mutation (`$ roasting...`)
  - [ ] `onSuccess` redireciona para `/roast/${data.id}`
  - [ ] Tratar erros da mutation (console.error ou toast mínimo)
- [ ] Modificar `src/app/roast/[id]/page.tsx`:
  - [ ] Remover mock `roastData`
  - [ ] Chamar `caller.roast.getById(id)`
  - [ ] `notFound()` se retornar `null`
  - [ ] `Number(data.score)` onde necessário
  - [ ] Renderizar seção `suggested_fix` condicionalmente
- [ ] Testar fluxo completo manualmente (submit → resultado)
- [ ] `pnpm lint` e `pnpm exec biome check --write` passando sem erros
