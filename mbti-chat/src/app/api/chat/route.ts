import { NextRequest, NextResponse } from "next/server";
import { callLLM, getSystemPrompt, type ChatMessage } from "@/lib/llm";

export async function POST(req: NextRequest) {
  try {
    const { messages } = (await req.json()) as { messages: ChatMessage[] };

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "messages array is required" },
        { status: 400 }
      );
    }

    const fullMessages: ChatMessage[] = [
      { role: "system", content: getSystemPrompt() },
      ...messages,
    ];

    const reply = await callLLM(fullMessages);

    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
