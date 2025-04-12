import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

// Use a more widely available model
const MODEL_NAME = "gemini-2.0-flash" // Fallback to a more common model name

export async function POST(req: NextRequest) {
  try {
    const { prompt, language } = await req.json()

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    // Check if API key is available
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "Google Generative AI API key is not configured. Please check your environment variables." },
        { status: 500 },
      )
    }

    // Initialize the Google Generative AI with the API key
    const genAI = new GoogleGenerativeAI(apiKey)

    // For text-only input, use the gemini model
    const model = genAI.getGenerativeModel({ model: MODEL_NAME })

    const systemPrompt =
      "You are an expert programmer. Generate clean, efficient, and well-commented code based on the user's request."
    const fullPrompt = `${systemPrompt}\n\nGenerate ${language || "javascript"} code for: ${prompt}. Only return the code without explanations or markdown formatting.`

    const result = await model.generateContent(fullPrompt)
    const response = await result.response
    const text = response.text()

    return NextResponse.json({ code: text })
  } catch (error) {
    console.error("Error generating code:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to generate code"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
