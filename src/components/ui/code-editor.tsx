"use client";

import {
  type ComponentProps,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { tv, type VariantProps } from "tailwind-variants";
import { LANGUAGE_LABELS, LanguageSelector } from "./language-selector";

// ---------------------------------------------------------------------------
// Language registry
// ---------------------------------------------------------------------------

const SUPPORTED_LANGUAGES = [
  { key: "javascript", label: "JavaScript" },
  { key: "typescript", label: "TypeScript" },
  { key: "tsx", label: "TSX" },
  { key: "jsx", label: "JSX" },
  { key: "python", label: "Python" },
  { key: "go", label: "Go" },
  { key: "rust", label: "Rust" },
  { key: "java", label: "Java" },
  { key: "ruby", label: "Ruby" },
  { key: "php", label: "PHP" },
  { key: "sql", label: "SQL" },
  { key: "bash", label: "Shell" },
  { key: "css", label: "CSS" },
  { key: "html", label: "HTML" },
  { key: "json", label: "JSON" },
  { key: "yaml", label: "YAML" },
  { key: "markdown", label: "Markdown" },
  { key: "text", label: "Plain Text" },
] as const;

// Keys used for hljs auto-detection (subset that hljs understands)
const HLJS_DETECTION_SUBSET = [
  "javascript",
  "typescript",
  "python",
  "go",
  "rust",
  "java",
  "ruby",
  "php",
  "sql",
  "bash",
  "css",
  "xml", // html maps to xml in hljs
  "json",
  "yaml",
  "markdown",
];

// Map hljs result → shiki lang key
const HLJS_TO_SHIKI: Record<string, string> = {
  xml: "html",
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const codeEditor = tv({
  slots: {
    root: "w-full overflow-hidden border border-border-primary bg-bg-input",
    header:
      "flex h-10 items-center justify-between gap-3 border-b border-border-primary px-4",
    headerLeft: "flex items-center gap-2",
    dot: "size-3 rounded-full",
    body: "flex",
    lineNumbers:
      "flex min-w-[48px] select-none flex-col items-end border-r border-border-primary bg-bg-surface px-3 py-4 font-mono text-[13px] leading-relaxed text-text-tertiary",
    editorArea: "relative flex-1",
    textarea:
      "absolute inset-0 h-full w-full resize-none bg-transparent p-4 font-mono text-[13px] leading-relaxed text-transparent outline-none",
    overlay:
      "pointer-events-none min-h-[320px] w-full p-4 font-mono text-[13px] leading-relaxed [&>pre]:!bg-transparent [&>pre]:font-mono [&_code]:font-mono",
  },
});

type CodeEditorVariants = VariantProps<typeof codeEditor>;
type CodeEditorProps = Omit<ComponentProps<"div">, "onChange"> &
  CodeEditorVariants & {
    defaultValue?: string;
    onChange?: (code: string, language: string) => void;
    minLines?: number;
  };

// ---------------------------------------------------------------------------
// Highlight cache to avoid redundant Shiki calls
// ---------------------------------------------------------------------------

let highlighterInstance: Awaited<
  ReturnType<typeof import("shiki").createHighlighter>
> | null = null;
let highlighterPromise: Promise<
  Awaited<ReturnType<typeof import("shiki").createHighlighter>>
> | null = null;

async function getHighlighter() {
  if (highlighterInstance) return highlighterInstance;
  if (highlighterPromise) return highlighterPromise;

  highlighterPromise = import("shiki").then(({ createHighlighter }) =>
    createHighlighter({
      themes: ["vesper"],
      langs: [
        "javascript",
        "typescript",
        "tsx",
        "jsx",
        "python",
        "go",
        "rust",
        "java",
        "ruby",
        "php",
        "sql",
        "bash",
        "css",
        "html",
        "json",
        "yaml",
        "markdown",
      ],
    }),
  );

  highlighterInstance = await highlighterPromise;
  return highlighterInstance;
}

// ---------------------------------------------------------------------------
// Language auto-detection via highlight.js
// ---------------------------------------------------------------------------

async function detectLanguage(code: string): Promise<string> {
  if (!code.trim()) return "text";

  const { default: hljs } = await import("highlight.js/lib/core");

  // Lazy-register languages only once
  if (!hljs.getLanguage("javascript")) {
    const [
      { default: javascript },
      { default: typescript },
      { default: python },
      { default: go },
      { default: rust },
      { default: java },
      { default: ruby },
      { default: php },
      { default: sql },
      { default: bash },
      { default: css },
      { default: xml },
      { default: json },
      { default: yaml },
      { default: markdown },
    ] = await Promise.all([
      import("highlight.js/lib/languages/javascript"),
      import("highlight.js/lib/languages/typescript"),
      import("highlight.js/lib/languages/python"),
      import("highlight.js/lib/languages/go"),
      import("highlight.js/lib/languages/rust"),
      import("highlight.js/lib/languages/java"),
      import("highlight.js/lib/languages/ruby"),
      import("highlight.js/lib/languages/php"),
      import("highlight.js/lib/languages/sql"),
      import("highlight.js/lib/languages/bash"),
      import("highlight.js/lib/languages/css"),
      import("highlight.js/lib/languages/xml"),
      import("highlight.js/lib/languages/json"),
      import("highlight.js/lib/languages/yaml"),
      import("highlight.js/lib/languages/markdown"),
    ]);

    hljs.registerLanguage("javascript", javascript);
    hljs.registerLanguage("typescript", typescript);
    hljs.registerLanguage("python", python);
    hljs.registerLanguage("go", go);
    hljs.registerLanguage("rust", rust);
    hljs.registerLanguage("java", java);
    hljs.registerLanguage("ruby", ruby);
    hljs.registerLanguage("php", php);
    hljs.registerLanguage("sql", sql);
    hljs.registerLanguage("bash", bash);
    hljs.registerLanguage("css", css);
    hljs.registerLanguage("xml", xml);
    hljs.registerLanguage("json", json);
    hljs.registerLanguage("yaml", yaml);
    hljs.registerLanguage("markdown", markdown);
  }

  const result = hljs.highlightAuto(code, HLJS_DETECTION_SUBSET);
  const detected = result.language ?? "text";
  return HLJS_TO_SHIKI[detected] ?? detected;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const placeholderCode = `function calculateTotal(items) {
  var total = 0;
  for (var i = 0; i < items.length; i++) {
    total = total + items[i].price;
  }

  if (total > 100) {
    console.log("discount applied");
    total = total * 0.9;
  }

  // TODO: handle tax calculation
  // TODO: handle currency conversion

  return total;
}`;

function CodeEditor({
  defaultValue = placeholderCode,
  onChange,
  className,
  minLines = 20,
  ...props
}: CodeEditorProps) {
  const slots = codeEditor();
  const [code, setCode] = useState(defaultValue);
  const [detectedLang, setDetectedLang] = useState("javascript");
  const [selectedLang, setSelectedLang] = useState<string | null>(null);
  const [highlightedHtml, setHighlightedHtml] = useState<string>("");
  const [isReady, setIsReady] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeLang = selectedLang ?? detectedLang;

  // Sync textarea and overlay scroll
  function handleScroll() {
    if (textareaRef.current && overlayRef.current) {
      overlayRef.current.scrollTop = textareaRef.current.scrollTop;
      overlayRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }

  // Ref to the highlighter once ready — allows fully synchronous highlighting
  const highlighterRef = useRef<Awaited<
    ReturnType<typeof import("shiki").createHighlighter>
  > | null>(null);

  // Run highlight — synchronous when highlighter is already loaded
  const runHighlight = useCallback((currentCode: string, lang: string) => {
    const hl = highlighterRef.current;
    if (!hl) {
      // Still loading — queue async
      getHighlighter().then((h) => {
        highlighterRef.current = h;
        try {
          const html = h.codeToHtml(currentCode || " ", {
            lang: lang === "text" ? "javascript" : lang,
            theme: "vesper",
          });
          setHighlightedHtml(html);
          setIsReady(true);
        } catch {
          setHighlightedHtml(
            `<pre><code>${currentCode.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>`,
          );
          setIsReady(true);
        }
      });
      return;
    }

    // Synchronous path — no async overhead on keystrokes
    try {
      const html = hl.codeToHtml(currentCode || " ", {
        lang: lang === "text" ? "javascript" : lang,
        theme: "vesper",
      });
      setHighlightedHtml(html);
      setIsReady(true);
    } catch {
      setHighlightedHtml(
        `<pre><code>${currentCode.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>`,
      );
      setIsReady(true);
    }
  }, []);

  // Initial highlight on mount (run once) — also warms up the highlighterRef
  const initializedRef = useRef(false);
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    async function init() {
      const [hl, lang] = await Promise.all([
        getHighlighter(),
        detectLanguage(defaultValue),
      ]);
      highlighterRef.current = hl;
      setDetectedLang(lang);
      runHighlight(defaultValue, lang);
    }
    init();
  }, [defaultValue, runHighlight]);

  // Re-highlight when selectedLang changes (manual override)
  const prevSelectedLangRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    // Skip the first render (handled by init above)
    if (prevSelectedLangRef.current === undefined) {
      prevSelectedLangRef.current = selectedLang;
      return;
    }
    if (!isReady) return;
    if (prevSelectedLangRef.current === selectedLang) return;
    prevSelectedLangRef.current = selectedLang;
    runHighlight(code, activeLang);
  }, [selectedLang, isReady, code, activeLang, runHighlight]);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const newCode = e.target.value;
    setCode(newCode);

    // Highlight runs immediately — the singleton is synchronous after init
    runHighlight(newCode, activeLang);

    // Auto-detection is debounced (expensive) — only when no manual lang selected
    if (selectedLang === null) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        const lang = await detectLanguage(newCode);
        setDetectedLang(lang);
        runHighlight(newCode, lang);
        onChange?.(newCode, lang);
      }, 400);
    } else {
      onChange?.(newCode, activeLang);
    }
  }

  function handleLanguageChange(lang: string | null) {
    setSelectedLang(lang);
    const nextLang = lang ?? detectedLang;
    runHighlight(code, nextLang);
    onChange?.(code, nextLang);
  }

  const lineCount = Math.max(code.split("\n").length, minLines);
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  return (
    <div className={slots.root({ className })} {...props}>
      {/* Window header */}
      <div className={slots.header()}>
        <div className={slots.headerLeft()}>
          <span className={`${slots.dot()} bg-accent-red`} />
          <span className={`${slots.dot()} bg-accent-amber`} />
          <span className={`${slots.dot()} bg-accent-green`} />
        </div>
        <LanguageSelector
          languages={[...SUPPORTED_LANGUAGES]}
          detectedLanguage={detectedLang}
          selectedLanguage={selectedLang}
          onLanguageChange={handleLanguageChange}
          title={
            selectedLang === null
              ? `Auto-detected: ${LANGUAGE_LABELS[detectedLang] ?? detectedLang}`
              : `Language: ${LANGUAGE_LABELS[selectedLang] ?? selectedLang}`
          }
        />
      </div>

      {/* Body: line numbers + editor */}
      <div className={slots.body()}>
        <div className={slots.lineNumbers()} aria-hidden="true">
          {lineNumbers.map((n) => (
            <span key={n}>{n}</span>
          ))}
        </div>

        <div className={slots.editorArea()}>
          {/* Shiki overlay (visible, non-interactive) */}
          <div
            ref={overlayRef}
            className={slots.overlay()}
            // biome-ignore lint/security/noDangerouslySetInnerHtml: controlled shiki output
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
            style={{ visibility: isReady ? "visible" : "hidden" }}
          />

          {/* Actual textarea (transparent text, green caret) */}
          <textarea
            ref={textareaRef}
            value={code}
            onChange={handleChange}
            onScroll={handleScroll}
            className={slots.textarea()}
            style={{
              caretColor: "var(--color-accent-green)",
              // Show plain text while highlighter is loading
              color: isReady ? "transparent" : "var(--color-text-primary)",
            }}
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            placeholder="// paste your code here..."
          />
        </div>
      </div>
    </div>
  );
}

export {
  CodeEditor,
  SUPPORTED_LANGUAGES,
  type CodeEditorProps,
  type CodeEditorVariants,
};
