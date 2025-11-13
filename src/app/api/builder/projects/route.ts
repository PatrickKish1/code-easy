import { NextRequest, NextResponse } from "next/server";
import { getAppwriteClient } from "@/lib/appwrite";
import { Query } from "node-appwrite";
import { getAuthenticatedUserId } from "@/lib/auth-client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const sessionToken = request.headers.get("authorization")?.replace("Bearer ", "") || null;
    
    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = await getAuthenticatedUserId(sessionToken);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { databases, config } = getAppwriteClient();
    
    // Check if we need a builder projects collection
    // For now, we'll use a separate collection or add a type field to projects
    // Let's use the existing projects collection with a type field
    
    if (projectId) {
      try {
        const doc = await databases.getDocument(config.databaseId, config.projectsCollectionId, projectId);
        // Verify it belongs to the user and is a builder project
        if (doc.userId !== userId || !doc.type || doc.type !== "builder") {
          return NextResponse.json({ error: "Not found" }, { status: 404 });
        }
        return NextResponse.json({ project: doc });
      } catch (error: any) {
        if (error.code === 404) {
          return NextResponse.json({ project: null });
        }
        throw error;
      }
    }

    // List all builder projects for the user
    const docs = await databases.listDocuments(
      config.databaseId,
      config.projectsCollectionId,
      [
        Query.equal("userId", userId),
        Query.equal("type", "builder"),
      ]
    );

    const projects = (docs.documents || []).map((d: any) => ({
      id: d.$id,
      name: d.name,
      description: d.description || null,
      framework: d.framework || "nextjs",
      status: d.status || "scaffolding",
      previewUrl: d.previewUrl || null,
      previewPort: d.previewPort || null,
      projectPath: d.projectPath || null,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    }));

    return NextResponse.json({ projects });
  } catch (error) {
    console.error("Failed to list builder projects:", error);
    return NextResponse.json({ error: "Failed to list projects" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.headers.get("authorization")?.replace("Bearer ", "") || null;
    
    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = await getAuthenticatedUserId(sessionToken);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, framework } = body as {
      name: string;
      description?: string;
      framework?: string;
    };

    if (!name) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 });
    }

    const { databases, config } = getAppwriteClient();
    
    const projectData: any = {
      name,
      userId,
      type: "builder", // Mark as builder project
      description: description || "",
      framework: framework || "nextjs",
      status: "scaffolding",
      activeFilePath: null,
      openFilePaths: [],
      dirtyFiles: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const created = await databases.createDocument(
      config.databaseId,
      config.projectsCollectionId,
      "unique()",
      projectData
    );

    return NextResponse.json({
      project: {
        id: created.$id,
        name: created.name,
        description: created.description || null,
        framework: created.framework || "nextjs",
        status: created.status || "scaffolding",
        userId: created.userId,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      }
    });
  } catch (error) {
    console.error("Failed to create builder project:", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}

