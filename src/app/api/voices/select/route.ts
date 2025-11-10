import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { voiceId } = await request.json();

    if (!voiceId || typeof voiceId !== "string") {
      return NextResponse.json(
        { error: "voiceId is required" },
        { status: 400 },
      );
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    const agentId =
      process.env.ELEVENLABS_AGENT_ID || process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;

    if (!apiKey || !agentId) {
      return NextResponse.json(
        { error: "ElevenLabs credentials are not configured" },
        { status: 500 },
      );
    }

    const response = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        tts: {
          voice_id: voiceId,
        },
      }),
    });

    const payload = await response.json().catch(() => undefined);

    if (!response.ok) {
      const message =
        payload?.error || payload?.detail || payload?.message || "Failed to update voice with ElevenLabs";
      return NextResponse.json({ error: message }, { status: response.status });
    }

    return NextResponse.json({ success: true, data: payload });
  } catch (error) {
    console.error("Error updating ElevenLabs voice:", error);
    return NextResponse.json(
      { error: "Failed to update voice" },
      { status: 500 },
    );
  }
}


