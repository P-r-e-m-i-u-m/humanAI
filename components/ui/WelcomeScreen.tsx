"use client"

import { motion } from "framer-motion"
import ChatInput from "@/components/ui/ChatInput"

interface Props {
  onSuggest: (text: string) => void
  isLoading: boolean
  onStop?: () => void
}

export default function WelcomeScreen({ onSuggest, isLoading, onStop }: Props) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center h-full px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-2xl flex flex-col items-center"
      >
        <h1
          className="text-4xl font-serif mb-8 text-center"
          style={{ color: "var(--text-secondary)", fontWeight: 400 }}
        >
          What would you like to do?
        </h1>

        <div className="w-full">
          <ChatInput
            onSend={onSuggest}
            isLoading={isLoading}
            onStop={onStop}
            hideChips
            hideFooter
          />
        </div>
      </motion.div>
    </div>
  )
}