import type React from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Header />
      <div className="min-h-screen flex flex-col">
        <div className="flex-1">{children}</div>
      </div>
      <Footer />
    </>
  )
}
