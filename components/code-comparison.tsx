"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CodeEditor } from "@/components/code-editor"
import { ArrowLeft, ArrowRight } from "lucide-react"

interface CodeComparisonProps {
  originalCode: string
  newCode: string
  language: string
  onClose: () => void
}

export function CodeComparison({ originalCode, newCode, language, onClose }: CodeComparisonProps) {
  const [view, setView] = useState<"split" | "unified">("split")

  // Simple diff highlighting (this is a basic implementation)
  const highlightDifferences = (original: string, updated: string) => {
    const originalLines = original.split("\n")
    const updatedLines = updated.split("\n")

    // This is a very simple diff - in a real app, you'd use a proper diff algorithm
    const diffLines = updatedLines.map((line, i) => {
      if (i >= originalLines.length) {
        return `+ ${line}` // Added line
      }
      if (line !== originalLines[i]) {
        return `~ ${line}` // Modified line
      }
      return `  ${line}` // Unchanged line
    })

    return diffLines.join("\n")
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Code Comparison</CardTitle>
          <div className="flex gap-2">
            <Tabs value={view} onValueChange={(v) => setView(v as "split" | "unified")}>
              <TabsList>
                <TabsTrigger value="split">Split View</TabsTrigger>
                <TabsTrigger value="unified">Unified View</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {view === "split" ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="mb-2 font-medium text-sm flex items-center">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Original Code
              </div>
              <CodeEditor value={originalCode} onChange={() => {}} language={language} readOnly />
            </div>
            <div>
              <div className="mb-2 font-medium text-sm flex items-center">
                <ArrowRight className="h-4 w-4 mr-1" />
                New Code
              </div>
              <CodeEditor value={newCode} onChange={() => {}} language={language} readOnly />
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-2 font-medium text-sm">Unified Diff</div>
            <CodeEditor
              value={highlightDifferences(originalCode, newCode)}
              onChange={() => {}}
              language={language}
              readOnly
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
