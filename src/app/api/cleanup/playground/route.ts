import { NextRequest, NextResponse } from "next/server";
import { getAppwriteClient } from "@/lib/appwrite";
import { Query } from "node-appwrite";

/**
 * Cleanup endpoint for expired playground projects
 * This should be called periodically (e.g., via a cron job) to remove playground projects
 * that have expired (older than 24 hours)
 */
export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication/authorization check here if needed
    // The cleanup endpoint is safe to expose - it only deletes expired projects
    // If you want to secure it, set CLEANUP_API_KEY and uncomment below:
    /*
    const authHeader = request.headers.get("authorization");
    const apiKey = process.env.CLEANUP_API_KEY;
    
    if (apiKey && authHeader !== `Bearer ${apiKey}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    */
    
    const { databases, config } = getAppwriteClient();
    const now = Date.now();
    
    // Find all playground projects that have expired
    // Playground projects have IDs starting with "playground-" and an expiresAt field
    const allProjects = await databases.listDocuments(
      config.databaseId,
      config.projectsCollectionId,
      []
    );
    
    const expiredProjects = (allProjects.documents || []).filter((doc: any) => {
      const isPlayground = doc.$id.startsWith("playground-");
      if (!isPlayground) return false;
      
      const expiresAt = doc.expiresAt ? parseInt(doc.expiresAt) : null;
      if (!expiresAt) {
        // If no expiresAt, consider it expired if older than 24 hours
        const createdAt = new Date(doc.createdAt).getTime();
        return (now - createdAt) > 24 * 60 * 60 * 1000;
      }
      
      return expiresAt < now;
    });
    
    console.log(`Found ${expiredProjects.length} expired playground projects`);
    
    let deletedProjects = 0;
    let deletedFiles = 0;
    
    // Delete expired projects and their files
    for (const project of expiredProjects) {
      try {
        const projectId = project.$id;
        
        // Delete all files associated with this project
        const filesQuery = [Query.equal("projectId", projectId)];
        const files = await databases.listDocuments(
          config.databaseId,
          config.filesCollectionId,
          filesQuery
        );
        
        for (const file of files.documents || []) {
          try {
            await databases.deleteDocument(
              config.databaseId,
              config.filesCollectionId,
              file.$id
            );
            deletedFiles++;
          } catch (error) {
            console.error(`Failed to delete file ${file.$id}:`, error);
          }
        }
        
        // Delete the project
        await databases.deleteDocument(
          config.databaseId,
          config.projectsCollectionId,
          projectId
        );
        deletedProjects++;
      } catch (error) {
        console.error(`Failed to delete project ${project.$id}:`, error);
      }
    }
    
    return NextResponse.json({
      success: true,
      deletedProjects,
      deletedFiles,
      message: `Cleaned up ${deletedProjects} expired playground projects and ${deletedFiles} files`,
    });
  } catch (error) {
    console.error("Failed to cleanup expired playground projects:", error);
    return NextResponse.json(
      { error: "Failed to cleanup expired playground projects" },
      { status: 500 }
    );
  }
}

// Allow GET requests for manual cleanup triggers
export async function GET(request: NextRequest) {
  return POST(request);
}

