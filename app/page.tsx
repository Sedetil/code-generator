"use client"

import { useEffect, useState } from "react"
import { CodeGenerator } from "@/components/code-generator"
import { useSearchParams } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { InfoIcon } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { supabase } from "@/lib/supabase"

export default function Home() {
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [supabaseError, setSupabaseError] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    // Check if Supabase is initialized
    if (typeof window !== "undefined") {
      try {
        // Set up auth state listener
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
          setCurrentUser(session?.user || null)
          setIsLoading(false)
        })

        // Initial session check
        const checkSession = async () => {
          const {
            data: { session },
          } = await supabase.auth.getSession()
          setCurrentUser(session?.user || null)
          setIsLoading(false)
        }

        checkSession()

        return () => {
          subscription.unsubscribe()
        }
      } catch (error) {
        console.error("Supabase error:", error)
        setSupabaseError(true)
        setIsLoading(false)
      }
    } else {
      setIsLoading(false)
    }

    // Check for shared code in URL
    const sharedData = searchParams.get("data")
    if (sharedData) {
      try {
        const parsedData = JSON.parse(decodeURIComponent(sharedData))
        console.log("Shared code data:", parsedData)
        // You could handle the shared code here or pass it to the CodeGenerator
      } catch (error) {
        console.error("Error parsing shared data:", error)
      }
    }
  }, [searchParams])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <>
      <Header />
      <main className="container mx-auto py-10 px-4 md:px-6 flex-1 relative z-0">
        <h1 className="text-3xl font-bold text-center mb-8">Gemini Code Generator</h1>

        {supabaseError && (
          <div
            className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded-md dark:bg-yellow-900/30 dark:text-yellow-200 dark:border-yellow-400"
            role="alert"
          >
            <p className="font-bold">Note</p>
            <p>
              Supabase authentication is currently unavailable. You can still use the code generator, but saving
              snippets will use local storage only.
            </p>
          </div>
        )}

        {/* Only show login alert if user is not logged in */}
        {!currentUser && (
          <Alert className="mb-6">
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>Login to Save Snippets</AlertTitle>
            <AlertDescription>
              You need to be logged in to save and access your code snippets across devices. Login using the button in
              the top right corner.
            </AlertDescription>
          </Alert>
        )}

        <CodeGenerator />
      </main>
      <Footer />
    </>
  )
}
