# Spec: Code Editor com Syntax Highlight

> **Status:** Ready for implementation
> **Scope:** Homepage (`/`) — componente `CodeEditor` em `home-client.tsx`

---

## Contexto e Objetivo

Hoje o `CodeEditor` é um `<textarea>` simples sem nenhum highlight. O objetivo é transformá-lo em um editor de "paste & view" onde:

1. O usuário cola um trecho de código e vê o syntax highlight aplicado automaticamente.
2. A linguagem é detectada automaticamente, mas o usuário pode sobrescrevê-la manualmente via um seletor no header do editor.
3. O `CodeBlock` (usado em resultados do roast e leaderboard) ganha numeração de linhas na lateral esquerda.

O foco é **paste & view** — sem features de IDE. Sem autocomplete, sem folding, sem linting.

---

## Pesquisa: Opções de Editor

### Opção A — ray-so pattern: `<textarea>` + overlay Shiki (Recomendada)

Estratégia adotada pelo [ray-so (Raycast)](https://github.com/raycast/ray-so):

- Uma `<textarea>` transparente e invisível gerencia o input do usuário.
- Uma `<div>` sobreposta (mesmo tamanho, mesma fonte) renderiza o HTML produzido pelo Shiki.
- CSS alinha os dois layers com precisão (`position: absolute`, `font-*` idênticos).
- A detecção de linguagem usa `highlight.js` (exclusivamente `highlightAuto()`).
- O Shiki renderiza os tokens com o tema escolhido.

**Vantagens para o DevRoast:**
- Zero dependência nova pesada — o projeto **já usa Shiki v4**. Basta adicionar `highlight.js` para detecção.
- Padrão comprovado em produção por um produto amplamente utilizado.
- Levíssimo: sem runtime de editor (Monaco pesa ~4 MB, CodeMirror ~400 KB).
- Renderização 100% server-capable no `CodeBlock` (já é async RSC).
- Shiki v4 tem `codeToHtml` síncrono no browser via módulo ES.

**Desvantagens:**
- Requer sincronização de scroll entre a `textarea` e o overlay (se o conteúdo transbordar). Mitigável fixando altura mínima + `overflow: auto` apenas no container externo.
- Não tem cursor estilizado visível sobre o código — mas para "paste & view" isso não é problema.

### Opção B — CodeMirror 6

- Editor rico, extensível, acessível.
- Tem extensão de highlight via `@codemirror/language` e linguagens via `@codemirror/lang-*`.
- Pesa ~400 KB e requer adaptadores para integrar o tema vesper do Shiki.
- **Descartada:** overhead desnecessário para um caso de uso de leitura/paste.

### Opção C — Monaco Editor

- Editor do VS Code. Funcionalidades extremas.
- Pesa ~4 MB e é overkill absoluto.
- **Descartada.**

### Opção D — `<textarea>` simples + highlight.js rendering

- Sem Shiki. Qualidade de tokenização inferior ao vesper.
- **Descartada:** o projeto já tem Shiki e o tema vesper deve ser mantido.

**Decisão: Opção A.** Sem novas dependências de editor. Aproveitamento total do Shiki já instalado.

---

## Detecção de Linguagem

### Biblioteca: `highlight.js` — `highlightAuto()`

- `highlight.js` é a solução padrão do mercado para auto-detecção sem configuração.
- Usado pelo ray-so com exatamente esse propósito.
- A função `highlightAuto(code, languageSubset)` recebe o código e uma lista de linguagens candidatas, e retorna a mais provável com um score de relevância.
- É **síncrona** e **leve** — ideal para rodar on every `onChange`.

### Linguagens Suportadas (prioridade)

| Linguagem | Shiki lang key | hljs lang key |
|-----------|---------------|---------------|
| JavaScript | `javascript` | `javascript` |
| TypeScript | `typescript` | `typescript` |
| TSX | `tsx` | `xml` (fallback) |
| JSX | `jsx` | `xml` (fallback) |
| Python | `python` | `python` |
| Go | `go` | `go` |
| Rust | `rust` | `rust` |
| Java | `java` | `java` |
| Ruby | `ruby` | `ruby` |
| PHP | `php` | `php` |
| SQL | `sql` | `sql` |
| Shell/Bash | `bash` | `bash` |
| CSS | `css` | `css` |
| HTML | `html` | `xml` |
| JSON | `json` | `json` |
| YAML | `yaml` | `yaml` |
| Markdown | `markdown` | `markdown` |
| Plain text | `text` | — (fallback) |

### Fluxo de Detecção

```
usuário cola/digita código
        ↓
hljs.highlightAuto(code, LANGUAGE_SUBSET)
        ↓
  detectedLanguage (ou "text" como fallback)
        ↓
  ┌─────────────────────────────────────┐
  │  userSelectedLanguage !== null?     │
  │  → usar userSelectedLanguage        │
  │  caso contrário:                    │
  │  → usar detectedLanguage            │
  └─────────────────────────────────────┘
        ↓
shiki.codeToHtml(code, { lang, theme: "vesper" })
        ↓
  atualiza overlay div
```

---

## Arquitetura do Editor

### Pattern: Textarea + Shiki Overlay

```
┌─────────────────────────────────────────────┐
│  CodeEditor container (position: relative)  │
│                                             │
│  ┌─ Window Header ───────────────────────┐  │
│  │  ● ● ●   [language selector]          │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  ┌─ Editor Body ─────────────────────────┐  │
│  │ ┌─ Line Numbers ─┐ ┌─ Code Area ────┐ │  │
│  │ │  1             │ │ <textarea>      │ │  │
│  │ │  2             │ │ (transparent)   │ │  │
│  │ │  3             │ │                 │ │  │
│  │ │                │ │ <div overlay>   │ │  │
│  │ │                │ │ (shiki html,    │ │  │
│  │ │                │ │  pointer-events │ │  │
│  │ │                │ │  none)          │ │  │
│  │ └────────────────┘ └─────────────────┘ │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

### Considerações de Implementação

**Sincronização de scroll:** `<textarea>` e `<div>` overlay precisam do mesmo scroll. Como o editor tem altura fixa e o conteúdo pode exceder, usar `overflow: hidden` na textarea e `overflow: auto` só no container externo é uma abordagem válida. Alternativa: sincronizar scroll via `onScroll` na textarea.

**Font metrics:** Ambos os layers DEVEM usar `font-mono` (JetBrains Mono), `font-size: 13px`, `line-height: relaxed` (1.625). Qualquer divergência causa desalinhamento entre cursor e texto visível.

**Caret:** A `<textarea>` tem `color: transparent` e `caret-color: var(--color-accent-green)` para manter o cursor visível e com a cor do tema.

**Background:** A `<textarea>` tem `background: transparent`. O background real (`bg-bg-input`) fica no container.

**Pointer events:** O overlay `<div>` tem `pointer-events: none` para não interceptar cliques/seleção da textarea.

**Shiki no client:** Shiki v4 pode rodar no browser. Usar `codeToHtml` de `shiki` com import dinâmico lazy para não bloquear o bundle inicial. Inicializar o highlighter uma vez (singleton no módulo ou em um `useRef`) e reutilizar. Alternativa: usar `shiki/bundle/web` que já inclui as linguagens comuns.

**Debounce:** A chamada ao Shiki pode ser debounced em ~150ms para evitar re-rendering excessivo enquanto o usuário digita.

---

## Componentes a Criar/Modificar

### 1. `src/components/ui/code-editor.tsx` — NOVO

Componente client `"use client"`. Recebe:

```tsx
type CodeEditorProps = {
  defaultValue?: string;
  onChange?: (code: string, language: string) => void;
  className?: string;
};
```

Responsabilidades:
- Gerenciar estado do código (`code`), linguagem detectada (`detectedLang`) e linguagem selecionada pelo usuário (`selectedLang`).
- Renderizar o `<textarea>` + overlay.
- Renderizar o `LanguageSelector` no header.
- Inicializar o Shiki highlighter (singleton).
- Rodar `hljs.highlightAuto` a cada mudança de código.
- Chamar `codeToHtml` a cada mudança de código ou linguagem.

### 2. `src/components/ui/language-selector.tsx` — NOVO

Componente client simples. Seletor de linguagem no header do editor.

```tsx
type LanguageSelectorProps = {
  languages: Language[];
  value: string;           // linguagem atual (auto ou manual)
  isAuto: boolean;         // true quando não há seleção manual
  onChange: (lang: string | null) => void; // null = resetar para auto
};
```

UI: `<select>` nativo (ou `@base-ui/react` Select se disponível) com a lista de linguagens. Quando `isAuto=true`, mostra "(auto)" ao lado do nome da linguagem detectada. Opção "auto-detect" no topo para resetar para detecção automática.

Styling: usar `tv()`, tokens do globals.css, `font-mono`.

### 3. `src/components/ui/code-block.tsx` — MODIFICAR

Adicionar numeração de linhas na lateral esquerda.

Mudanças:
- Contar linhas do código recebido (`code.split("\n").length`).
- Renderizar uma coluna de line numbers com `font-mono`, `text-text-tertiary`, `text-right`, alinhada ao topo.
- Adicionar border-right `border-border-primary` entre a coluna de números e o código.
- Usar `display: flex` no container do código para posicionar números + código lado a lado.

### 4. `src/app/home-client.tsx` — MODIFICAR

Substituir o `<textarea>` atual pelo novo `<CodeEditor>`.

---

## Estrutura de Arquivo Proposta

```
src/
  components/
    ui/
      code-editor.tsx       ← NOVO: editor textarea+overlay
      language-selector.tsx ← NOVO: seletor de linguagem
      code-block.tsx        ← MODIFICAR: adicionar line numbers
  app/
    home-client.tsx         ← MODIFICAR: usar CodeEditor
```

---

## Dependências

| Pacote | Versão | Motivo |
|--------|--------|--------|
| `shiki` | já instalado (^4.0.2) | Syntax highlight com tema vesper |
| `highlight.js` | ~^11.x | Auto-detecção de linguagem |

Apenas `highlight.js` é nova dependência. É pequena (~45 KB minzipped para o bundle completo, menos se usar apenas a detecção com subset de linguagens via `registerLanguage` manual).

Para minimizar bundle size, importar apenas as linguagens do subset de prioridade:
```ts
import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
// ... registrar individualmente
hljs.registerLanguage("javascript", javascript);
```

---

## Comportamento do Language Selector

| Estado | UI mostrada |
|--------|-------------|
| Código detectado como JavaScript, sem seleção manual | `javascript (auto)` |
| Usuário seleciona TypeScript manualmente | `typescript` |
| Usuário seleciona "auto-detect" | Volta para detecção automática |
| Código muito curto/ambíguo, detecção incerta | `text` (plain text, sem highlight) |

---

## Line Numbers no CodeBlock

O `CodeBlock` atual não tem numeração de linhas. O design no Pencil (Screen 1 - Code Input) mostra claramente uma coluna de line numbers com:
- Largura fixa de ~48px
- Números alinhados à direita
- Cor `text-tertiary`
- Border right `border-border-primary`
- Fonte `font-mono` tamanho 13px

Implementação no `CodeBlock`:

```tsx
const lines = code.split("\n");
const lineCount = lines.length;

// Renderizar junto ao HTML do Shiki:
<div className="flex">
  <div className="line-numbers ...">
    {Array.from({ length: lineCount }, (_, i) => (
      <span key={i + 1}>{i + 1}</span>
    ))}
  </div>
  <div dangerouslySetInnerHTML={{ __html: html }} />
</div>
```

Atenção: o Shiki pode renderizar o HTML com `<pre><code>` estruturado por linhas via `codeToHtml`. Usar o transformer `line` para atribuir `data-line` a cada linha, o que facilita alinhar com os números renderizados separadamente. Alternativamente, usar `codeToHast` + renderização manual para ter controle total sobre a estrutura.

---

## Checklist de Implementação

- [ ] Instalar `highlight.js` via pnpm
- [ ] Criar `src/components/ui/language-selector.tsx`
- [ ] Criar `src/components/ui/code-editor.tsx` com:
  - [ ] Textarea + overlay pattern
  - [ ] Shiki singleton no client
  - [ ] hljs auto-detecção
  - [ ] Estado de linguagem (auto vs manual)
  - [ ] Caret verde (`caret-color: var(--color-accent-green)`)
  - [ ] Debounce no highlight (~150ms)
- [ ] Modificar `src/components/ui/code-block.tsx` para adicionar line numbers
- [ ] Modificar `src/app/home-client.tsx` para usar `<CodeEditor>`
- [ ] Rodar `pnpm lint` e `pnpm format` ao final

---

## Referências

- ray-so Editor.tsx: `app/(navigation)/(code)/components/Editor.tsx`
- ray-so HighlightedCode.tsx: `app/(navigation)/(code)/components/HighlightedCode.tsx`
- ray-so store/code.ts: detecção com `hljs.highlightAuto()`
- Shiki docs: https://shiki.style
- highlight.js autodetection: https://highlightjs.readthedocs.io/en/latest/api.html#highlightauto
