"use client";

import { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";

type CodeEditorProps = {
  value: string;
  onChange: (value: string) => void;
  language: string;
};

export default function CodeEditor({ value, onChange, language }: CodeEditorProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-[420px] items-center justify-center rounded-md border border-border bg-surface text-sm text-muted-foreground">
        Loading editor...
      </div>
    );
  }

  return (
    <div className="h-[420px] overflow-hidden rounded-md border border-border">
      <Editor
        height="100%"
        language={language}
        value={value}
        onChange={(nextValue) => onChange(nextValue ?? "")}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: "var(--font-mono)",
          automaticLayout: true,
          scrollBeyondLastLine: false,
        }}
      />
    </div>
  );
}
