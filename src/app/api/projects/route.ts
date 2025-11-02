import { NextRequest, NextResponse } from "next/server";
import { getAppwriteClient } from "@/lib/appwrite";

export async function GET() {
  try {
    const { databases, config } = getAppwriteClient();
    const docs = await databases.listDocuments(config.databaseId, config.projectsCollectionId, []);
    const projects = (docs.documents || []).map((d: any) => ({
      id: d.$id,
      name: d.name,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
      activeFilePath: d.activeFilePath || null,
      openFilePaths: d.openFilePaths || [],
      dirtyFiles: d.dirtyFiles || [],
    }));
    return NextResponse.json({ projects });
  } catch (error) {
    console.error("Failed to list projects:", error);
    return NextResponse.json({ error: "Failed to list projects" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, id } = body as { name: string; id?: string };
    
    if (!name) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 });
    }

    const { databases, config } = getAppwriteClient();
    
    const projectData = {
      name,
      activeFilePath: null,
      openFilePaths: [],
      dirtyFiles: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const created = await databases.createDocument(
      config.databaseId, 
      config.projectsCollectionId, 
      id || "unique()", 
      projectData
    );

    return NextResponse.json({ 
      project: {
        id: created.$id,
        name: created.name,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
        activeFilePath: created.activeFilePath,
        openFilePaths: created.openFilePaths,
        dirtyFiles: created.dirtyFiles,
      }
    });
  } catch (error) {
    console.error("Failed to create project:", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, activeFilePath, openFilePaths, dirtyFiles } = body as { 
      id: string; 
      name?: string; 
      activeFilePath?: string | null; 
      openFilePaths?: string[]; 
      dirtyFiles?: string[]; 
    };
    
    if (!id) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    const { databases, config } = getAppwriteClient();
    
    // Build update data - only include fields that are provided
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };
    
    if (name !== undefined) updateData.name = name;
    if (activeFilePath !== undefined) {
      // Appwrite accepts null for optional string attributes
      updateData.activeFilePath = activeFilePath;
    }
    if (openFilePaths !== undefined) {
      // Ensure arrays are properly formatted for Appwrite
      updateData.openFilePaths = Array.isArray(openFilePaths) ? openFilePaths : [];
    }
    if (dirtyFiles !== undefined) {
      // Ensure arrays are properly formatted for Appwrite
      updateData.dirtyFiles = Array.isArray(dirtyFiles) ? dirtyFiles : [];
    }
    
    console.log("Updating project:", id, "with data:", JSON.stringify(updateData, null, 2));
    
    const updated = await databases.updateDocument(
      config.databaseId, 
      config.projectsCollectionId, 
      id, 
      updateData
    );

    return NextResponse.json({ 
      project: {
        id: updated.$id,
        name: updated.name,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
        activeFilePath: updated.activeFilePath,
        openFilePaths: updated.openFilePaths || [],
        dirtyFiles: updated.dirtyFiles || [],
      }
    });
  } catch (error: any) {
    console.error("Failed to update project:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      type: error.type,
      response: error.response,
    });
    return NextResponse.json({ 
      error: "Failed to update project",
      details: error.message || String(error),
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    const { databases, config } = getAppwriteClient();
    
    // Delete all files associated with this project
    const files = await databases.listDocuments(config.databaseId, config.filesCollectionId, []);
    const projectFiles = (files.documents || []).filter((f: any) => f.projectId === id);
    
    for (const file of projectFiles) {
      await databases.deleteDocument(config.databaseId, config.filesCollectionId, file.$id);
    }
    
    // Delete the project
    await databases.deleteDocument(config.databaseId, config.projectsCollectionId, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete project:", error);
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }
}
