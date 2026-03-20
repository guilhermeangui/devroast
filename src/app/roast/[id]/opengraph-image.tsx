// src/app/roast/[id]/opengraph-image.tsx
import { ImageResponse } from "@takumi-rs/image-response";
import { db } from "@/db";
import { roasts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verdictColor } from "@/lib/verdict";

export const runtime = "nodejs";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "devroast score card";

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [roast] = await db
    .select({
      score: roasts.score,
      verdict: roasts.verdict,
      language: roasts.language,
      lineCount: roasts.lineCount,
      roastQuote: roasts.roastQuote,
    })
    .from(roasts)
    .where(eq(roasts.id, id))
    .limit(1);

  if (!roast) {
    return new ImageResponse(
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: "#0a0a0a",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span style={{ color: "#22c55e", fontFamily: "monospace", fontSize: 24 }}>
          {">"} devroast
        </span>
      </div>,
      {
        ...size,
        headers: { "Cache-Control": "public, immutable, max-age=31536000" },
      },
    );
  }

  const dotColor = verdictColor[roast.verdict];
  const [whole, decimal] = Number(roast.score).toFixed(1).split(".");

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        background: "#0a0a0a",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        padding: "0 80px",
      }}
    >
      {/* Branding */}
      <span
        style={{
          color: "#22c55e",
          fontFamily: "monospace",
          fontSize: 14,
          letterSpacing: 1,
        }}
      >
        {">"} devroast
      </span>

      {/* Score */}
      <div style={{ display: "flex", alignItems: "flex-end", lineHeight: 1 }}>
        <span
          style={{
            color: "#f59e0b",
            fontSize: 120,
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          {whole}.{decimal}
        </span>
        <span
          style={{
            color: "#4b5563",
            fontSize: 40,
            fontWeight: 400,
            paddingBottom: 16,
            marginLeft: 4,
          }}
        >
          /10
        </span>
      </div>

      {/* Verdict */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            background: dotColor,
          }}
        />
        <span
          style={{
            color: dotColor,
            fontFamily: "monospace",
            fontSize: 16,
          }}
        >
          {roast.verdict}
        </span>
      </div>

      {/* Language + lines */}
      <span style={{ color: "#6b7280", fontFamily: "monospace", fontSize: 14 }}>
        lang: {roast.language} · {roast.lineCount} lines
      </span>

      {/* Roast quote */}
      <span
        style={{
          color: "#9ca3af",
          fontFamily: "monospace",
          fontSize: 16,
          fontStyle: "italic",
          textAlign: "center",
          maxWidth: 800,
        }}
      >
        "{roast.roastQuote}"
      </span>
    </div>,
    {
      ...size,
      headers: { "Cache-Control": "public, immutable, max-age=31536000" },
    },
  );
}
