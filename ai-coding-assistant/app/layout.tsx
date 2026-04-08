import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "AI Coding Assistant",
  description: "Your personal AI tutor for learning to code and building projects",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
