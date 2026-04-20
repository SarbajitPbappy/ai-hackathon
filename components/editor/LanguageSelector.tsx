"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const SUPPORTED_LANGUAGES = [
  { id: 54, label: "C++17", monaco: "cpp" },
  { id: 71, label: "Python 3", monaco: "python" },
  { id: 62, label: "Java", monaco: "java" },
  { id: 63, label: "JavaScript", monaco: "javascript" },
  { id: 60, label: "Go", monaco: "go" },
  { id: 73, label: "Rust", monaco: "rust" },
] as const;

export type SupportedLanguageId = (typeof SUPPORTED_LANGUAGES)[number]["id"];

export default function LanguageSelector({
  value,
  onChange,
}: {
  value: SupportedLanguageId;
  onChange: (value: SupportedLanguageId) => void;
}) {
  return (
    <Select value={String(value)} onValueChange={(nextValue) => onChange(Number(nextValue) as SupportedLanguageId)}>
      <SelectTrigger aria-label="Language selector" className="w-[180px] bg-surface">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SUPPORTED_LANGUAGES.map((language) => (
          <SelectItem key={language.id} value={String(language.id)}>
            {language.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
