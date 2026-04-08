import { ChevronLeft } from "lucide-react"
import Link from "next/link"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white p-8 max-w-4xl mx-auto">
      <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-white mb-8 transition-colors">
        <ChevronLeft size={20} />
        Back to Chat
      </Link>
      
      <h1 className="text-4xl font-serif mb-6">About Us</h1>
      <p className="text-lg text-muted-foreground leading-relaxed mb-12">
        Created by Syed Abdul Aman, CodeAI is a community-powered platform for understanding AI performance...
      </p>

      {/* Replicate the "Mission" and "Vision" cards from your Arena screenshot */}
      <div className="grid gap-6">
        <div className="bg-[#1a1a1a] p-6 rounded-xl border border-white/5">
          <h3 className="text-xl mb-2">Our Mission</h3>
          <p className="text-muted-foreground">To measure and advance the frontier of AI for real-world use.</p>
        </div>
        {/* Add more sections here... */}
      </div>
    </div>
  )
}