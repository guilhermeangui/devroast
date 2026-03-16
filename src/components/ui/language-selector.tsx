"use client";

import type { ComponentProps } from "react";
import { tv, type VariantProps } from "tailwind-variants";

const languageSelector = tv({
  base: "cursor-pointer appearance-none bg-transparent font-mono text-xs text-text-secondary outline-none transition-colors hover:text-text-primary focus:text-text-primary",
});

type LanguageSelectorVariants = VariantProps<typeof languageSelector>;
type LanguageSelectorProps = Omit<ComponentProps<"select">, "onChange"> &
  LanguageSelectorVariants & {
    languages: { key: string; label: string }[];
    detectedLanguage: string;
    selectedLanguage: string | null;
    onLanguageChange: (lang: string | null) => void;
  };

const LANGUAGE_LABELS: Record<string, string> = {
  javascript: "JavaScript",
  typescript: "TypeScript",
  tsx: "TSX",
  jsx: "JSX",
  python: "Python",
  go: "Go",
  rust: "Rust",
  java: "Java",
  ruby: "Ruby",
  php: "PHP",
  sql: "SQL",
  bash: "Shell",
  css: "CSS",
  html: "HTML",
  json: "JSON",
  yaml: "YAML",
  markdown: "Markdown",
  text: "Plain Text",
};

function LanguageSelector({
  languages,
  detectedLanguage,
  selectedLanguage,
  onLanguageChange,
  className,
  ...props
}: LanguageSelectorProps) {
  const isAuto = selectedLanguage === null;
  const currentValue = isAuto ? `auto:${detectedLanguage}` : selectedLanguage;

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    if (val.startsWith("auto:") || val === "auto") {
      onLanguageChange(null);
    } else {
      onLanguageChange(val);
    }
  }

  return (
    <select
      value={currentValue}
      onChange={handleChange}
      className={languageSelector({ className })}
      {...props}
    >
      <option value={`auto:${detectedLanguage}`}>
        {LANGUAGE_LABELS[detectedLanguage] ?? detectedLanguage} (auto)
      </option>
      <option disabled value="">
        ──────────
      </option>
      {languages.map((lang) => (
        <option key={lang.key} value={lang.key}>
          {lang.label}
        </option>
      ))}
    </select>
  );
}

export {
  LanguageSelector,
  languageSelector,
  LANGUAGE_LABELS,
  type LanguageSelectorProps,
  type LanguageSelectorVariants,
};
