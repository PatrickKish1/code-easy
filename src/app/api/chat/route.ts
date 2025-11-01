import { NextRequest, NextResponse } from "next/server";
import { aiService, CodeGenerationRequest } from "@/lib/ai-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { threadId, prompt, context } = body as CodeGenerationRequest;

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const response = await aiService.generateCode({
      threadId: threadId || aiService.createThread(),
      prompt,
      context,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const threadId = searchParams.get("threadId");

    if (!threadId) {
      return NextResponse.json(
        { error: "Thread ID is required" },
        { status: 400 }
      );
    }

    const history = await aiService.getConversationHistory(threadId);
    return NextResponse.json({ messages: history });
  } catch (error) {
    console.error("Get history error:", error);
    return NextResponse.json(
      { error: "Failed to get conversation history" },
      { status: 500 }
    );
  }
}
