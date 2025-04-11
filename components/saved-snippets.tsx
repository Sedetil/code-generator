"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Trash, Edit, Eye, Save, Loader2 } from "lucide-react"
import type { CodeSnippet } from "./code-generator"
import { CodeEditor } from "./code-editor"

interface SavedSnippetsProps {
  snippets: CodeSnippet[]
  onLoad: (snippet: CodeSnippet) => void
  onDelete: (id: string) => void
  isLoading?: boolean
}

export function SavedSnippets({ snippets, onLoad, onDelete, isLoading = false }: SavedSnippetsProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedSnippet, setExpandedSnippet] = useState<string | null>(null)

  const filteredSnippets = snippets.filter(
    (snippet) =>
      snippet.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      snippet.language.toLowerCase().includes(searchTerm.toLowerCase()) ||
      snippet.prompt.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const toggleExpand = (id: string) => {
    setExpandedSnippet(expandedSnippet === id ? null : id)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading your saved snippets...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Your Saved Code Snippets</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Search snippets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-4"
          />

          {filteredSnippets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {snippets.length === 0 ? (
                <div className="flex flex-col items-center space-y-2">
                  <Save className="h-12 w-12 text-muted-foreground/50" />
                  <p>You haven't saved any snippets yet.</p>
                  <p className="text-sm">Generate some code and save it to see it here.</p>
                </div>
              ) : (
                "No snippets match your search."
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSnippets.map((snippet) => (
                <Card key={snippet.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{snippet.title}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs px-2 py-1 bg-primary/10 rounded-full">{snippet.language}</span>
                          <span className="text-xs text-muted-foreground">{formatDate(snippet.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => toggleExpand(snippet.id)} title="Preview">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => onLoad(snippet)} title="Edit">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => onDelete(snippet.id)} title="Delete">
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pb-2">
                    <p className="text-sm text-muted-foreground line-clamp-2">{snippet.prompt}</p>
                  </CardContent>

                  {expandedSnippet === snippet.id && (
                    <CardContent className="pt-0">
                      <CodeEditor
                        value={snippet.code}
                        onChange={() => {}}
                        language={snippet.language}
                        readOnly={true}
                      />
                    </CardContent>
                  )}

                  <CardFooter className="pt-2">
                    <Button variant="outline" size="sm" className="w-full" onClick={() => onLoad(snippet)}>
                      Load Snippet
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
