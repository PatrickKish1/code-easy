// Client-side auth helpers
import { Client, Account } from "appwrite";

export function getAppwriteAuthClient(sessionToken?: string) {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT as string)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID as string);

  if (sessionToken) {
    client.setSession(sessionToken);
  }

  return {
    client,
    account: new Account(client),
  };
}

export async function getAuthenticatedUserId(sessionToken: string): Promise<string | null> {
  try {
    const { account } = getAppwriteAuthClient(sessionToken);
    const user = await account.get();
    return user.$id;
  } catch (error) {
    console.error("Failed to get authenticated user:", error);
    return null;
  }
}

