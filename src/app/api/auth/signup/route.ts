import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    // Create user account using Appwrite REST API
    const createResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/account`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Appwrite-Project": process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID as string,
        },
        body: JSON.stringify({
          userId: `unique()`, // Let Appwrite generate ID
          email,
          password,
          name: name || email.split("@")[0],
        }),
      }
    );

    if (!createResponse.ok) {
      const error = await createResponse.json().catch(() => ({ message: "Signup failed" }));
      return NextResponse.json(
        { error: error.message || "Failed to create account" },
        { status: 400 }
      );
    }

    const user = await createResponse.json();

    // Create session immediately after signup
    const sessionResponse = await fetch(
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

    if (!sessionResponse.ok) {
      return NextResponse.json(
        { error: "Account created but failed to create session" },
        { status: 500 }
      );
    }

    const sessionData = await sessionResponse.json();

    return NextResponse.json({
      session: {
        userId: sessionData.userId,
        token: sessionData.secret,
      },
      user: {
        id: user.$id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error: any) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create account" },
      { status: 400 }
    );
  }
}

