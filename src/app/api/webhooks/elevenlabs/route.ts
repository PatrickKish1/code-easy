import { NextRequest, NextResponse } from "next/server";
import { getAppwriteClient } from "@/lib/appwrite";
import { broadcast } from "@/lib/realtime";

type CodeAction = {
  type: "create" | "update" | "delete" | "rename";
  path: string;
  newPath?: string;
  content?: string;
  isFolder?: boolean;
};

// ElevenLabs server tool format
type ElevenLabsWebhookBody = {
  action_type?: "create" | "update" | "delete" | "rename";
  file_path?: string;
  new_path?: string;
  file_content?: string;
  is_folder?: boolean;
  project_id?: string;
  description?: string;
};

// Legacy format (for direct API calls)
type LegacyWebhookBody = {
  projectId: string;
  actions: CodeAction[];
  requestId?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Check if it's ElevenLabs format (single action) or legacy format (array of actions)
    if ('action_type' in body || 'file_path' in body) {
      // ElevenLabs server tool format
      const { action_type, file_path, new_path, file_content, is_folder, project_id, description } = body as ElevenLabsWebhookBody;
      
      if (!action_type || !file_path || !project_id) {
        return NextResponse.json({ 
          error: "action_type, file_path, and project_id are required",
          received: body 
        }, { status: 400 });
      }

      const action: CodeAction = {
        type: action_type,
        path: file_path,
        content: file_content,
        newPath: new_path,
        isFolder: is_folder || false,
      };

      await processAction(project_id, action);
      
      return NextResponse.json({ 
        success: true, 
        message: `Successfully ${action_type} ${file_path}`,
        description 
      });
    } else if ('actions' in body) {
      // Legacy format (array of actions)
      const { projectId, actions, requestId } = body as LegacyWebhookBody;
      if (!projectId || !actions || actions.length === 0) {
        return NextResponse.json({ error: "projectId and actions are required" }, { status: 400 });
      }

      for (const action of actions) {
        await processAction(projectId, action);
      }

      return NextResponse.json({ ok: true, requestId: requestId || null });
    } else {
      return NextResponse.json({ 
        error: "Invalid request format. Expected ElevenLabs tool format or legacy format.",
        received: body 
      }, { status: 400 });
    }
  } catch (error) {
    console.error("ElevenLabs webhook error:", error);
    return NextResponse.json({ error: "Failed to process webhook" }, { status: 500 });
  }
}

async function processAction(projectId: string, action: CodeAction) {

  const { databases, config } = getAppwriteClient();
  const list = await databases.listDocuments(config.databaseId, config.filesCollectionId, [] as any);
  const docs = list.documents || [];

  switch (action.type) {
    case "delete": {
      if (action.isFolder) {
        const toDelete = docs.filter((d: any) => d.projectId === projectId && (d.path as string).startsWith(action.path));
        for (const d of toDelete) {
          await databases.deleteDocument(config.databaseId, config.filesCollectionId, d.$id);
          broadcast("file:deleted", { projectId, path: d.path });
        }
      } else {
        const doc = docs.find((d: any) => d.projectId === projectId && d.path === action.path);
        if (doc) {
          await databases.deleteDocument(config.databaseId, config.filesCollectionId, doc.$id);
          broadcast("file:deleted", { projectId, path: action.path });
        }
      }
      break;
    }
    case "rename": {
      if (!action.newPath) return;
      if (action.isFolder) {
        const toMove = docs.filter((d: any) => d.projectId === projectId && (d.path as string).startsWith(action.path));
        for (const d of toMove) {
          const suffix = (d.path as string).slice(action.path.length);
          const updated = await databases.updateDocument(config.databaseId, config.filesCollectionId, d.$id, { path: action.newPath + suffix });
          broadcast("file:renamed", { projectId, oldPath: d.path, newPath: updated.path });
        }
      } else {
        const doc = docs.find((d: any) => d.projectId === projectId && d.path === action.path);
        if (doc) {
          const updated = await databases.updateDocument(config.databaseId, config.filesCollectionId, doc.$id, { path: action.newPath });
          broadcast("file:renamed", { projectId, oldPath: action.path, newPath: updated.path });
        }
      }
      break;
    }
    case "create":
    case "update": {
      const existing = docs.find((d: any) => d.projectId === projectId && d.path === action.path);
      const payload: any = action.isFolder ? { path: action.path, isFolder: true, projectId } : { path: action.path, content: action.content ?? "", projectId };
      if (existing) {
        const updated = await databases.updateDocument(config.databaseId, config.filesCollectionId, existing.$id, payload);
        broadcast("file:updated", { projectId, path: updated.path, content: updated.content ?? "", isFolder: !!updated.isFolder });
      } else {
        const created = await databases.createDocument(config.databaseId, config.filesCollectionId, "unique()", payload);
        broadcast("file:created", { projectId, path: created.path, content: created.content ?? "", isFolder: !!created.isFolder });
      }
      break;
    }
  }
}


