import Link from "next/link"
import { Code, Github } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="responsive-container py-6 sm:py-8 md:py-12">
        <div className="responsive-grid-1-3 gap-6 md:gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Code className="h-5 w-5 text-primary" />
              <span className="font-bold text-lg">Gemini Code</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Generate high-quality code using Google Gemini AI. Save, share, and manage your code snippets.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-medium">Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Home
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="font-medium">Connect</h3>
            <div className="flex items-center gap-3">
              <a
                href="https://github.com/Sedetil"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Github className="h-5 w-5" />
                <span className="sr-only">GitHub</span>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Gemini Code Generator. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
