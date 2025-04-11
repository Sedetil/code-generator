"use client"

import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { LoginForm } from "./login-form"
import { RegisterForm } from "./register-form"
import { ForgotPassword } from "./forgot-password"

type AuthView = "login" | "register" | "forgotPassword"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [view, setView] = useState<AuthView>("login")

  const handleSuccess = () => {
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        {view === "login" && (
          <LoginForm
            onSuccess={handleSuccess}
            onRegisterClick={() => setView("register")}
            onForgotPasswordClick={() => setView("forgotPassword")}
          />
        )}
        {view === "register" && <RegisterForm onSuccess={handleSuccess} onLoginClick={() => setView("login")} />}
        {view === "forgotPassword" && <ForgotPassword onBackToLogin={() => setView("login")} />}
      </DialogContent>
    </Dialog>
  )
}
