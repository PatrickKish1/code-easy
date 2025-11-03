import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const sessionToken = authHeader?.replace("Bearer ", "");

    if (!sessionToken) {
      return NextResponse.json({ user: null, authenticated: false });
    }

    // Verify session and get user info
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/account`,
      {
        headers: {
          "X-Appwrite-Project": process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID as string,
          "X-Appwrite-Session": sessionToken,
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json({ user: null, authenticated: false });
    }

    const user = await response.json();

    return NextResponse.json({
      user: {
        id: user.$id,
        email: user.email,
        name: user.name,
      },
      authenticated: true,
    });
  } catch (error: any) {
    console.error("Session check error:", error);
    return NextResponse.json({ user: null, authenticated: false });
  }
}

