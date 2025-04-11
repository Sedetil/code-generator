"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ProfilePage } from "@/components/profile/profile-page"
import { Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function Profile() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [authError, setAuthError] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (typeof window === "undefined") return

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setIsAuthenticated(true)
      } else {
        setIsAuthenticated(false)
        router.push("/")
      }
    })

    // Initial session check
    const checkSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) throw error

        if (session?.user) {
          setIsAuthenticated(true)
        } else {
          setIsAuthenticated(false)
          router.push("/")
        }
      } catch (error) {
        console.error("Auth state error:", error)
        setAuthError(true)
        setIsAuthenticated(false)
        router.push("/")
      }
    }

    checkSession()

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  if (isAuthenticated === null && !authError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (isAuthenticated === false || authError) {
    // Will redirect in useEffect
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Redirecting to home page...</p>
      </div>
    )
  }

  return <ProfilePage />
}
