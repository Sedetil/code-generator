import type { CodeSnippet } from "@/components/code-generator"

const STORAGE_KEY = "gemini-code-snippets"

export async function saveCodeSnippet(snippet: CodeSnippet): Promise<void> {
  const snippets = await getSavedSnippets()
  const updatedSnippets = [...snippets, snippet]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSnippets))
}

export async function getSavedSnippets(): Promise<CodeSnippet[]> {
  if (typeof window === "undefined") return []

  const storedSnippets = localStorage.getItem(STORAGE_KEY)
  if (!storedSnippets) return []

  try {
    return JSON.parse(storedSnippets)
  } catch (error) {
    console.error("Error parsing saved snippets:", error)
    return []
  }
}

export async function deleteSnippet(id: string): Promise<void> {
  const snippets = await getSavedSnippets()
  const updatedSnippets = snippets.filter((snippet) => snippet.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSnippets))
}

export async function updateSnippet(updatedSnippet: CodeSnippet): Promise<void> {
  const snippets = await getSavedSnippets()
  const updatedSnippets = snippets.map((snippet) => (snippet.id === updatedSnippet.id ? updatedSnippet : snippet))
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSnippets))
}
