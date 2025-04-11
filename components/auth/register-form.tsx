"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Check } from "lucide-react"
import ReCAPTCHA from "react-google-recaptcha"
import { supabase } from "@/lib/supabase"
import { createUserProfile } from "@/lib/supabase-utils"

interface RegisterFormProps {
  onSuccess: () => void
  onLoginClick: () => void
}

export function RegisterForm({ onSuccess, onLoginClick }: RegisterFormProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [captchaVerified, setCaptchaVerified] = useState(false)
  const [isVerificationSent, setIsVerificationSent] = useState(false)
  const { toast } = useToast()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Please make sure your passwords match",
        variant: "destructive",
      })
      return
    }

    if (!captchaVerified) {
      toast({
        title: "CAPTCHA verification required",
        description: "Please complete the CAPTCHA verification",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: name,
          },
        },
      })

      console.log("Sign up result:", data)

      if (error) {
        throw error
      }

      if (data.user) {
        try {
          console.log("Creating user profile for:", data.user.id)

          await createUserProfile(data.user.id, {
            displayName: name,
            email: email,
            photoURL: "",
            authProvider: "email",
          })

          console.log("User profile created successfully.")
        } catch (profileError) {
          console.error("Error creating user profile:", profileError)
          toast({
            title: "Error creating user profile",
            description: "Your account was created, but we couldn't set up your profile.",
            variant: "destructive",
          })
        }

        toast({
          title: "Registration successful",
          description:
            "A verification email has been sent to your email address. Please check your inbox and click the verification link to complete your registration.",
        })

        setIsVerificationSent(true)
      }
    } catch (error: any) {
      console.error("Registration error:", JSON.stringify(error, null, 2))
      let errorMessage = "Registration failed. Please try again."

      if (error.message?.includes("already registered")) {
        errorMessage = "This email is already in use. Please use a different email."
      } else if (error.message?.includes("password")) {
        errorMessage = "Password is too weak. Please use a stronger password."
      }

      toast({
        title: "Registration failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCaptchaChange = (value: string | null) => {
    setCaptchaVerified(!!value)
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Register</CardTitle>
        <CardDescription>Create a new account</CardDescription>
      </CardHeader>
      <CardContent>
        {isVerificationSent ? (
          <div className="text-center py-4 space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-semibold">Verification Email Sent</h3>
            <p className="text-muted-foreground">
              We've sent a verification email to <span className="font-medium text-foreground">{email}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Please check your inbox and click the verification link to complete your registration. If you don't see
              the email, check your spam folder.
            </p>
            <Button variant="outline" onClick={onLoginClick} className="mt-4">
              Return to Login
            </Button>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-center my-4">
              <ReCAPTCHA
                sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"}
                onChange={handleCaptchaChange}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading || !captchaVerified}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Register
            </Button>
          </form>
        )}
      </CardContent>

      {!isVerificationSent && (
        <CardFooter className="flex justify-center">
          <Button variant="link" onClick={onLoginClick}>
            Already have an account? Login
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
