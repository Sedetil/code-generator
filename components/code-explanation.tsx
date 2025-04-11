"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Lightbulb } from "lucide-react"

interface CodeExplanationProps {
  explanation: string
}

export function CodeExplanation({ explanation }: CodeExplanationProps) {
  // Function to format explanation paragraphs and handle bullet points
  const formatExplanation = (text: string) => {
    // Split by newlines and filter out empty lines
    const paragraphs = text.split("\n").filter((line) => line.trim() !== "")

    return paragraphs.map((paragraph, index) => {
      // Check if this is a bullet point (starts with • or -)
      const isBulletPoint = paragraph.trim().startsWith("•") || paragraph.trim().startsWith("-")

      if (isBulletPoint) {
        return (
          <li key={index} className="ml-6 mb-2">
            {paragraph.trim().replace(/^[•-]\s*/, "")}
          </li>
        )
      }

      // Check if this looks like a heading (shorter, possibly ends with a colon)
      const isHeading = paragraph.length < 50 && paragraph.trim().endsWith(":")

      if (isHeading) {
        return (
          <h3 key={index} className="font-medium mt-4 mb-2">
            {paragraph}
          </h3>
        )
      }

      // Regular paragraph
      return (
        <p key={index} className="mb-3">
          {paragraph}
        </p>
      )
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2">
        <Lightbulb className="h-5 w-5 text-yellow-500" />
        <CardTitle>Code Explanation</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="prose dark:prose-invert max-w-none">{formatExplanation(explanation)}</div>
      </CardContent>
    </Card>
  )
}
