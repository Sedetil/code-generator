import { google } from "@ai-sdk/google"

// Create a configured instance of the Google provider
export const googleAI = google

// Helper function to check if the API key is available
export function isGoogleAIConfigured(): boolean {
  return !!process.env.GOOGLE_GENERATIVE_AI_API_KEY
}
