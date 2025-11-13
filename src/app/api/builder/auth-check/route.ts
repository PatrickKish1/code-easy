import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth-client";

/**
 * Verify user authentication for builder operations
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionToken } = body as {
      sessionToken?: string;
    };

    if (!sessionToken) {
      return NextResponse.json({ authenticated: false, error: "No session token provided" }, { status: 401 });
    }

    const userId = await getAuthenticatedUserId(sessionToken);
    
    if (!userId) {
      return NextResponse.json({ authenticated: false, error: "Invalid session token" }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      userId,
    });
  } catch (error) {
    console.error("Failed to check auth:", error);
    return NextResponse.json({
      authenticated: false,
      error: "Failed to verify authentication",
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
