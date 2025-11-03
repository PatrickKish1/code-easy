import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const sessionToken = authHeader?.replace("Bearer ", "");

    if (!sessionToken) {
      return NextResponse.json({ success: true }); // Already logged out
    }

    // Delete session using Appwrite REST API
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/account/sessions/current`,
        {
          method: "DELETE",
          headers: {
            "X-Appwrite-Project": process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID as string,
            "X-Appwrite-Session": sessionToken,
          },
        }
      );
    } catch (error) {
      // Ignore errors - session might already be invalid
      console.log("Session deletion error (ignored):", error);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Logout error:", error);
    // Even if logout fails, return success (session might already be invalid)
    return NextResponse.json({ success: true });
  }
}

