import { NextRequest, NextResponse } from "next/server";
import { getAppwriteClient } from "@/lib/appwrite";
import { Query } from "node-appwrite";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const projectId = searchParams.get("projectId");
    const { databases, config } = getAppwriteClient();
    
    // If a specific projectId is requested, fetch that project
    if (projectId) {
      try {
        const doc = await databases.getDocument(config.databaseId, config.projectsCollectionId, projectId);
        return NextResponse.json({
          project: {
            id: doc.$id,
            name: doc.name,
            userId: doc.userId || null,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
            activeFilePath: doc.activeFilePath || null,
            openFilePaths: doc.openFilePaths || [],
            dirtyFiles: doc.dirtyFiles || [],
            isPlayground: projectId.startsWith("playground-"),
            expiresAt: doc.expiresAt ? parseInt(doc.expiresAt) : undefined,
          }
        });
      } catch (error: any) {
        // Project not found - return null
        if (error.code === 404) {
          return NextResponse.json({ project: null });
        }
        throw error;
      }
    }
    
    // Build query filters - include playground projects if no userId filter
    const queries: string[] = [];
    if (userId) {
      // For authenticated users, only return their projects
      queries.push(Query.equal("userId", userId));
    } else {
      // For playground mode, return projects with null userId or playground IDs
      // We'll filter client-side for playground projects
    }
    
    const docs = await databases.listDocuments(
      config.databaseId, 
      config.projectsCollectionId, 
      queries.length > 0 ? queries : []
    );
    const projects = (docs.documents || []).map((d: any) => ({
      id: d.$id,
      name: d.name,
      userId: d.userId || null,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
      activeFilePath: d.activeFilePath || null,
      openFilePaths: d.openFilePaths || [],
      dirtyFiles: d.dirtyFiles || [],
      isPlayground: d.$id.startsWith("playground-"),
      expiresAt: d.expiresAt ? parseInt(d.expiresAt) : undefined,
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
    const { name, id, userId, isPlayground, expiresAt } = body as { 
      name: string; 
      id?: string; 
      userId?: string | null; 
      isPlayground?: boolean;
      expiresAt?: number;
    };
    
    if (!name) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 });
    }

    const { databases, config } = getAppwriteClient();
    
    // Determine if this is a playground project
    const projectId = id || `playground-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    const isPlaygroundProject = isPlayground || projectId.startsWith("playground-");
    
    // For playground projects, set expiresAt to 24 hours from now if not provided
    const projectExpiresAt = isPlaygroundProject 
      ? (expiresAt || Date.now() + 24 * 60 * 60 * 1000)
      : undefined;
    
    const projectData: any = {
      name,
      userId: isPlaygroundProject ? null : userId, // Playground projects have null userId
      activeFilePath: null,
      openFilePaths: [],
      dirtyFiles: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // Add expiresAt for playground projects
    if (isPlaygroundProject && projectExpiresAt) {
      projectData.expiresAt = projectExpiresAt.toString();
    }

    // For playground projects, use the provided ID (they're client-generated)
    // For authenticated projects, let Appwrite generate the ID
    const documentId = isPlaygroundProject ? projectId : (id || "unique()");
    
    try {
      const created = await databases.createDocument(
        config.databaseId, 
        config.projectsCollectionId, 
        documentId, 
        projectData
      );

      return NextResponse.json({ 
        project: {
          id: created.$id,
          name: created.name,
          userId: created.userId || null,
          createdAt: created.createdAt,
          updatedAt: created.updatedAt,
          activeFilePath: created.activeFilePath,
          openFilePaths: created.openFilePaths || [],
          dirtyFiles: created.dirtyFiles || [],
          isPlayground: isPlaygroundProject,
          expiresAt: projectExpiresAt,
        }
      });
    } catch (error: any) {
      // If document already exists (for playground projects), update it
      if (error.code === 409 && isPlaygroundProject) {
        const updated = await databases.updateDocument(
          config.databaseId,
          config.projectsCollectionId,
          documentId,
          {
            name: projectData.name,
            updatedAt: projectData.updatedAt,
            ...(projectExpiresAt ? { expiresAt: projectExpiresAt.toString() } : {}),
          }
        );
        return NextResponse.json({
          project: {
            id: updated.$id,
            name: updated.name,
            userId: updated.userId || null,
            createdAt: updated.createdAt,
            updatedAt: updated.updatedAt,
            activeFilePath: updated.activeFilePath,
            openFilePaths: updated.openFilePaths || [],
            dirtyFiles: updated.dirtyFiles || [],
            isPlayground: isPlaygroundProject,
            expiresAt: projectExpiresAt,
          }
        });
      }
      throw error;
    }
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
