import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey, config } = body;

    if (!apiKey) {
      return NextResponse.json({ error: "API key is required" }, { status: 400 });
    }

    if (!config) {
      return NextResponse.json({ error: "MCP server configuration is required" }, { status: 400 });
    }

    const response = await fetch("https://api.elevenlabs.io/v1/convai/mcp-servers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        config,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "Failed to create MCP server",
          details: data,
          status: response.status,
        },
        { status: response.status },
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error creating MCP server:", error);
    return NextResponse.json(
      {
        error: "Failed to create MCP server",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}


