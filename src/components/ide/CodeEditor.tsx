"use client";

import * as React from "react";
import Editor from "@monaco-editor/react";
import { getFileIconProps } from "@/lib/file-icons";

type CodeEditorProps = {
  path?: string;
  value: string;
  onChange: (code: string) => void;
  onSave?: () => void;
};

function guessLanguageFromPath(path?: string): string | undefined {
  if (!path) return undefined;
  const lower = path.toLowerCase();
  if (lower.endsWith(".ts")) return "typescript";
  if (lower.endsWith(".tsx")) return "typescript";
  if (lower.endsWith(".js")) return "javascript";
  if (lower.endsWith(".jsx")) return "javascript";
  if (lower.endsWith(".json")) return "json";
  if (lower.endsWith(".css")) return "css";
  if (lower.endsWith(".html") || lower.endsWith(".htm")) return "html";
  if (lower.endsWith(".md") || lower.endsWith(".markdown")) return "markdown";
  if (lower.endsWith(".sql")) return "sql";
  if (lower.endsWith(".py")) return "python";
  return undefined;
}

export function CodeEditor({ path, value, onChange, onSave }: CodeEditorProps) {
  const language = guessLanguageFromPath(path);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        onSave?.();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onSave]);

  const iconProps = path ? getFileIconProps(path) : null;

  return (
    <div className="h-full w-full flex flex-col">
      <div className="px-3 py-2 border-b flex items-center gap-2 text-xs text-muted-foreground">
        {iconProps && (
          <img
            src={iconProps.src}
            alt={iconProps.alt}
            className="h-4 w-4 object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/icons/file.svg";
            }}
          />
        )}
        <span>{path || "No file selected"}</span>
      </div>
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          defaultLanguage={language}
          language={language}
          theme="vs-dark"
          value={value}
          className="scale-[1.0]"
          onChange={(v) => onChange(v ?? "")}
          options={{
            fontSize: 16,
            minimap: { enabled: false },
            wordWrap: "on",
            automaticLayout: true,
            scrollBeyondLastLine: false,
            padding: { top: 8, bottom: 8 },
          }}
          loading={<div className="p-3 text-sm text-muted-foreground">Loading editor…</div>}
          path={path}
        />
      </div>
    </div>
  );
}


