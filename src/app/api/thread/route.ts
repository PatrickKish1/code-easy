import { NextRequest, NextResponse } from "next/server";
import { aiService } from "@/lib/ai-service";

export async function POST() {
  try {
    const threadId = aiService.createThread();
    return NextResponse.json({ threadId });
  } catch (error) {
    console.error("Create thread error:", error);
    return NextResponse.json(
      { error: "Failed to create thread" },
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

    const thread = aiService.getThread(threadId);
    if (!thread) {
      return NextResponse.json(
        { error: "Thread not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(thread);
  } catch (error) {
    console.error("Get thread error:", error);
    return NextResponse.json(
      { error: "Failed to get thread" },
      { status: 500 }
    );
  }
}
