import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey, mcpServerId, config } = body;

    if (!apiKey) {
      return NextResponse.json({ error: "API key is required" }, { status: 400 });
    }

    if (!mcpServerId) {
      return NextResponse.json({ error: "mcpServerId is required" }, { status: 400 });
    }

    if (!config) {
      return NextResponse.json({ error: "Update configuration is required" }, { status: 400 });
    }

    const response = await fetch(`https://api.elevenlabs.io/v1/convai/mcp-servers/${mcpServerId}`, {
      method: "PATCH",
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
          error: "Failed to update MCP server",
          details: data,
          status: response.status,
        },
        { status: response.status },
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error updating MCP server:", error);
    return NextResponse.json(
      {
        error: "Failed to update MCP server",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}


