import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createUserProfile } from "@/lib/supabase-utils"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Exchange the code for a session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Create or update user profile
      try {
        await createUserProfile(data.user.id, {
          displayName: data.user.user_metadata.full_name || data.user.user_metadata.name,
          email: data.user.email,
          photoURL: data.user.user_metadata.avatar_url,
          authProvider: data.user.app_metadata.provider || "email",
        })
      } catch (profileError) {
        console.error("Error creating user profile:", profileError)
      }
    }
  }

  // Redirect to the home page
  return NextResponse.redirect(requestUrl.origin)
}
