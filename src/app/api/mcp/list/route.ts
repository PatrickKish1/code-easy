import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey } = body;

    if (!apiKey) {
      return NextResponse.json({ error: "API key is required" }, { status: 400 });
    }

    const response = await fetch("https://api.elevenlabs.io/v1/convai/mcp-servers", {
      method: "GET",
      headers: {
        "xi-api-key": apiKey,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "Failed to fetch MCP servers",
          details: data,
          status: response.status,
        },
        { status: response.status },
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching MCP servers:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch MCP servers",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}


