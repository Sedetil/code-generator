"use client"

import { useEffect, useRef } from "react"
import { useTheme } from "next-themes"

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  language: string
  readOnly?: boolean
}

export function CodeEditor({ value, onChange, language, readOnly = false }: CodeEditorProps) {
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const preRef = useRef<HTMLPreElement>(null)
  const { theme } = useTheme()
  const isDarkTheme = theme === "dark"

  // Auto-resize the textarea based on content
  useEffect(() => {
    if (editorRef.current && preRef.current) {
      // Update pre content to match textarea
      preRef.current.textContent = value
    }
  }, [value])

  return (
    <div className="relative rounded-md overflow-hidden">
      <pre
        ref={preRef}
        className={`p-3 sm:p-4 text-xs sm:text-sm font-mono whitespace-pre-wrap break-words ${
          isDarkTheme ? "bg-zinc-900" : "bg-zinc-100"
        } overflow-auto`}
        style={{ minHeight: "100px" }}
      >
        <code>{value}</code>
      </pre>
      <textarea
        ref={editorRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute top-0 left-0 w-full h-full opacity-0 resize-none font-mono p-3 sm:p-4 text-xs sm:text-sm focus:opacity-100 focus:bg-background focus:z-10 focus:outline-none"
        spellCheck="false"
        readOnly={readOnly}
        style={{ minHeight: "100px" }}
      />
    </div>
  )
}
