import { NextRequest, NextResponse } from "next/server";
import { getAppwriteClient, ProjectFileDoc } from "@/lib/appwrite";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    
    const { databases, config } = getAppwriteClient();
    const docs = await databases.listDocuments(config.databaseId, config.filesCollectionId, []);
    
    // Filter files by project if projectId is provided
    let files = (docs.documents || []).map((d: any) => ({ 
      path: d.path as string, 
      content: (d.content ?? "") as string, 
      isFolder: !!d.isFolder,
      projectId: d.projectId || null
    }));
    
    if (projectId) {
      files = files.filter(f => f.projectId === projectId);
    }
    
    return NextResponse.json({ files });
  } catch (error) {
    console.error("Failed to list files:", error);
    return NextResponse.json({ error: "Failed to list files" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, path, content, isFolder, newPath, projectId } = body as { action: "create" | "update" | "delete" | "rename"; path: string; content?: string; isFolder?: boolean; newPath?: string; projectId?: string };
    const { databases, config } = getAppwriteClient();

    if (!path) return NextResponse.json({ error: "Path is required" }, { status: 400 });
    if (!projectId) return NextResponse.json({ error: "Project ID is required" }, { status: 400 });

    if (action === "delete") {
      const list = await databases.listDocuments(config.databaseId, config.filesCollectionId, [] as any);
      if (isFolder) {
        const toDelete = (list.documents || []).filter((d: any) => 
          (d.path as string).startsWith(path) && d.projectId === projectId
        );
        for (const d of toDelete) {
          await databases.deleteDocument(config.databaseId, config.filesCollectionId, d.$id);
        }
      } else {
        const doc = (list.documents || []).find((d: any) => d.path === path && d.projectId === projectId);
        if (doc) await databases.deleteDocument(config.databaseId, config.filesCollectionId, doc.$id);
      }
      return NextResponse.json({ ok: true });
    }

    if (action === "rename") {
      if (!newPath) return NextResponse.json({ error: "newPath is required for rename" }, { status: 400 });
      const list = await databases.listDocuments(config.databaseId, config.filesCollectionId, [] as any);
      if (isFolder) {
        const toMove = (list.documents || []).filter((d: any) => 
          (d.path as string).startsWith(path) && d.projectId === projectId
        );
        for (const d of toMove) {
          const suffix = (d.path as string).slice(path.length);
          await databases.updateDocument(config.databaseId, config.filesCollectionId, d.$id, { path: newPath + suffix });
        }
      } else {
        const doc = (list.documents || []).find((d: any) => d.path === path && d.projectId === projectId);
        if (doc) await databases.updateDocument(config.databaseId, config.filesCollectionId, doc.$id, { path: newPath });
      }
      return NextResponse.json({ ok: true });
    }

    if (!isFolder && !content && content !== "") {
      return NextResponse.json({ error: "Content is required for create/update" }, { status: 400 });
    }

    // Upsert behavior: if exists, update; else, create
    const list = await databases.listDocuments(config.databaseId, config.filesCollectionId, [] as any);
    const existing = (list.documents || []).find((d: any) => d.path === path && d.projectId === projectId);
    if (existing) {
      const payload: any = isFolder ? { isFolder: true } : { content };
      const updated = await databases.updateDocument(config.databaseId, config.filesCollectionId, existing.$id, payload);
      return NextResponse.json({ ok: true, id: updated.$id });
    } else {
      const payload: any = isFolder ? { path, isFolder: true, projectId } : { path, content, projectId };
      const created = await databases.createDocument(config.databaseId, config.filesCollectionId, "unique()", payload);
      return NextResponse.json({ ok: true, id: created.$id });
    }
  } catch (error) {
    console.error("Failed to apply file action:", error);
    return NextResponse.json({ error: "Failed to apply file action" }, { status: 500 });
  }
}


