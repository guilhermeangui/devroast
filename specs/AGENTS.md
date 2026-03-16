# Specs

Specs são documentos de planejamento criados **antes** de implementar uma feature. O objetivo é tomar decisões de design antecipadamente e ter um checklist claro de implementação.

## Formato

```
# Spec: <Nome da Feature>

> **Status:** Draft | Ready for implementation
> **Scope:** Arquivos/área afetada

---

## Contexto e Objetivo

O que existe hoje e o que queremos alcançar. Decisões de design relevantes (ex.: por que escolhemos X em vez de Y).

---

## Pesquisa / Opções Consideradas (se aplicável)

Comparar alternativas quando há trade-offs relevantes. Cada opção com vantagens, desvantagens e justificativa da decisão final.

---

## Arquitetura / Estrutura

Diagramas ASCII, estrutura de arquivos, fluxos de dados, contratos de API ou schema.

---

## Componentes / Arquivos a Criar ou Modificar

Lista com tipos esperados, responsabilidades e marcação NOVO / MODIFICAR.

---

## Dependências

Tabela de pacotes novos necessários com versão e motivo.

---

## Checklist de Implementação

- [ ] Tarefa granular e acionável
- [ ] ...
```

## Regras

- **Um spec por feature.** Não misturar features não relacionadas.
- **Nomeie o arquivo** com kebab-case descrevendo a feature: `feature-name.md`.
- **Decida antes de implementar.** O spec deve estar "Ready for implementation" antes de abrir qualquer arquivo de código.
- **Checklist é obrigatório.** Toda tarefa de implementação deve estar listada — incluindo lint/format no final.
- Seções opcionais podem ser omitidas se não forem relevantes para a feature.
