import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    // Use Appwrite REST API directly for session creation
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/account/sessions/email`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Appwrite-Project": process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID as string,
        },
        body: JSON.stringify({ email, password }),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Login failed" }));
      return NextResponse.json(
        { error: error.message || "Failed to login" },
        { status: 401 }
      );
    }

    const sessionData = await response.json();
    
    // Get user info using the session
    const userResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/account`,
      {
        headers: {
          "X-Appwrite-Project": process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID as string,
          "X-Appwrite-Session": sessionData.secret,
        },
      }
    );

    if (!userResponse.ok) {
      return NextResponse.json(
        { error: "Failed to get user information" },
        { status: 500 }
      );
    }

    const user = await userResponse.json();

    return NextResponse.json({
      session: {
        userId: sessionData.userId,
        token: sessionData.secret, // Session secret for authentication
      },
      user: {
        id: user.$id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to login" },
      { status: 401 }
    );
  }
}

