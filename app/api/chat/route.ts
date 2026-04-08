import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { buildSystemPrompt } from "@/lib/utils"
import type { UserMemory } from "@/types"

export const runtime = "nodejs"
export const maxDuration = 60

const client = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY!,
  baseURL: "https://integrate.api.nvidia.com/v1",
})

// A single message from the client — content can be a plain string OR a
// multimodal array built by ChatArea.buildContent()
type IncomingMessage = {
  role: "user" | "assistant" | "system"
  content: string | Array<unknown>
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      messages,
      memory,
    }: { messages: IncomingMessage[]; memory: UserMemory } = body

    if (!process.env.NVIDIA_API_KEY) {
      return NextResponse.json(
        { error: "NVIDIA_API_KEY is not configured. Add it to your .env.local file." },
        { status: 401 }
      )
    }

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: "Messages cannot be empty." }, { status: 400 })
    }

    const systemPrompt = buildSystemPrompt(memory?.level ?? "beginner", memory?.name)

    // ── Build the final messages array ──────────────────────────────────────
    // System prompt is always plain text.
    // User/assistant messages keep whatever content shape ChatArea sent us —
    // either a plain string or a multimodal array with image_url blocks.
    const allMessages = [
      { role: "system" as const, content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,   // pass through as-is (string or array)
      })),
    ]

    // ── Pick the right model & trim history for vision requests ─────────────
    const hasImages = messages.some(
      (m) =>
        Array.isArray(m.content) &&
        (m.content as Array<{ type?: string }>).some((b) => b?.type === "image_url")
    )

    // Vision model that works on NVIDIA NIM:
    const VISION_MODEL = "meta/llama-3.2-11b-vision-instruct"
    // Default text model:
    const TEXT_MODEL   = "qwen/qwen3-next-80b-a3b-instruct"

    const model = hasImages ? VISION_MODEL : TEXT_MODEL

    // For vision requests: only send the last 4 messages (2 turns) + current.
    // Sending too much history confuses vision models — they may describe old images.
    const trimmedMessages = hasImages
      ? allMessages.slice(0, 1).concat(allMessages.slice(-4)) // system + last 4
      : allMessages

    const stream = await client.chat.completions.create({
      model,
      messages: trimmedMessages as any,
      temperature: 0.6,
      top_p: 0.7,
      max_tokens: 4096,
      stream: true,
    })

    // ── Stream the response back to the client ───────────────────────────────
    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content ?? ""
            if (content) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
              )
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"))
          controller.close()
        } catch (err) {
          controller.error(err)
        }
      },
    })

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })

  } catch (error: unknown) {
    console.error("Chat API error:", error)

    if (error && typeof error === "object" && "status" in error) {
      const apiError = error as { status: number; message?: string }
      if (apiError.status === 429)
        return NextResponse.json({ error: "Rate limit hit. Please wait a moment and try again." }, { status: 429 })
      if (apiError.status === 401)
        return NextResponse.json({ error: "Invalid API key. Check your NVIDIA_API_KEY." }, { status: 401 })
      if (apiError.status === 400)
        return NextResponse.json({ error: "The selected model could not process this request. Try a different model." }, { status: 400 })
    }

    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}