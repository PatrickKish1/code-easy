// Server-side Appwrite SDK (do not import in client components)
import { Client, Databases, Storage } from "node-appwrite";

export type AppwriteConfig = {
  endpoint: string;
  projectId: string;
  apiKey: string;
  databaseId: string;
  filesCollectionId: string;
  bucketId: string;
  projectsCollectionId: string;
};

export function getAppwriteClient() {
  const endpoint = (process.env.APPWRITE_ENDPOINT || process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT) as string;
  const projectId = (process.env.APPWRITE_PROJECT_ID || process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) as string;
  const apiKey = process.env.APPWRITE_API_KEY as string;
  const databaseId = process.env.APPWRITE_DATABASE_ID as string;
  const filesCollectionId = process.env.APPWRITE_FILES_COLLECTION_ID as string;
  const bucketId = process.env.APPWRITE_BUCKET_ID as string;
  const projectsCollectionId = process.env.APPWRITE_PROJECTS_COLLECTION_ID as string;

  if (!endpoint || !projectId || !apiKey) {
    throw new Error("Missing Appwrite credentials");
  }

  const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  return {
    client,
    databases: new Databases(client),
    storage: new Storage(client),
    config: { endpoint, projectId, apiKey, databaseId, filesCollectionId, bucketId, projectsCollectionId },
  };
}

export type ProjectFileDoc = {
  path: string;
  content: string;
};
