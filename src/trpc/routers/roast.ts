import { createAnthropic } from "@ai-sdk/anthropic";
import { generateText, Output } from "ai";
import { eq } from "drizzle-orm";
import { z } from "zod";
import type { Roast } from "@/db/schema";
import { roasts } from "@/db/schema";
import { baseProcedure, createTRPCRouter } from "../init";

// ── AI output schema ───────────────────────────────────────────────────────

const roastOutputSchema = z.object({
  score: z.number(),
  roastQuote: z.string(),
  issues: z.array(
    z.object({
      severity: z.enum(["critical", "warning", "good"]),
      title: z.string(),
      description: z.string(),
    }),
  ),
  suggestedFix: z.string().nullable(),
  language: z.enum([
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
  ]),
});

// ── Verdict derivation ─────────────────────────────────────────────────────

function scoreToVerdict(score: number): Roast["verdict"] {
  if (score < 3.0) return "needs_serious_help";
  if (score < 5.0) return "pretty_bad";
  if (score < 7.0) return "could_be_worse";
  if (score < 9.0) return "not_terrible";
  return "surprisingly_good";
}

// ── Prompt builder ─────────────────────────────────────────────────────────

function buildPrompt(
  code: string,
  language: string,
  roastMode: boolean,
): string {
  const persona = roastMode
    ? `You are a brutally sarcastic senior engineer who roasts bad code mercilessly. Use sharp wit, dark humor, and cutting observations. No mercy.`
    : `You are a professional senior engineer giving an honest, direct technical code review. Be critical but constructive.`;

  return `${persona}

Analyze the following ${language} code and return a structured review.

Rules:
- score: a number from 0.0 to 10.0 (0 = catastrophically bad, 10 = near-perfect)
- roastQuote: a single punchy sentence that captures the code quality (${roastMode ? "make it savage and funny" : "make it direct and honest"})
- issues: 2 to 6 items covering what is wrong AND what is good (severity: "critical", "warning", or "good")
- suggestedFix: a unified diff showing the most impactful improvement, or null if no fix is needed
- language: the detected programming language (correct the input if wrong)

Code to review:
\`\`\`${language}
${code}
\`\`\``;
}

// ── Router ─────────────────────────────────────────────────────────────────

export const roastRouter = createTRPCRouter({
  submit: baseProcedure
    .input(
      z.object({
        code: z.string().min(1).max(50000),
        language: z.string(),
        roastMode: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const anthropic = createAnthropic();

      const { output } = await generateText({
        model: anthropic("claude-haiku-4-5-20251001"),
        output: Output.object({ schema: roastOutputSchema }),
        prompt: buildPrompt(input.code, input.language, input.roastMode),
      });

      const verdict = scoreToVerdict(output.score);
      const lineCount = input.code.split("\n").length;

      const [inserted] = await ctx.db
        .insert(roasts)
        .values({
          code: input.code,
          language: output.language,
          lineCount,
          roastMode: input.roastMode,
          score: String(output.score),
          roastQuote: output.roastQuote,
          verdict,
          issues: output.issues,
          suggestedFix: output.suggestedFix ?? null,
        })
        .returning({ id: roasts.id });

      return { id: inserted.id };
    }),

  getById: baseProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select()
        .from(roasts)
        .where(eq(roasts.id, input.id));
      return result[0] ?? null;
    }),
});
