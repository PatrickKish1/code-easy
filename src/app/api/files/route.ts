import { NextRequest, NextResponse } from "next/server";
import { getAppwriteClient, ProjectFileDoc } from "@/lib/appwrite";

// Security configuration
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB max file size
const ALLOWED_EXTENSIONS = [
  // Code files
  'js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'h', 'hpp',
  'go', 'rs', 'rb', 'php', 'swift', 'kt', 'scala', 'clj', 'ex', 'exs',
  // Web files
  'html', 'css', 'scss', 'sass', 'less', 'xml', 'json', 'yaml', 'yml',
  // Config files
  'env', 'gitignore', 'dockerfile', 'makefile', 'cmake',
  'toml', 'ini', 'cfg', 'conf',
  // Documentation
  'md', 'txt', 'rst', 'tex',
  // Scripts
  'sh', 'bash', 'zsh', 'fish', 'ps1',
  // Data files
  'csv', 'sql', 'db',
  // No extensions (common for config files)
  ''
];

// Security validation functions
function sanitizePath(path: string): string {
  // Remove any path traversal attempts
  let sanitized = path.replace(/\.\./g, '').replace(/\\/g, '/');
  
  // Remove leading slashes
  sanitized = sanitized.replace(/^\/+/, '');
  
  // Remove any null bytes or control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
  
  return sanitized;
}

function validateExtension(fileName: string): boolean {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  return ALLOWED_EXTENSIONS.includes(ext);
}

function validatePath(path: string): boolean {
  // Check for path traversal
  if (path.includes('..')) return false;
  
  // Check for absolute paths
  if (path.startsWith('/') || /^[A-Z]:\\/.test(path)) return false;
  
  // Check for control characters
  if (/[\x00-\x1F\x7F]/.test(path)) return false;
  
  return true;
}

function validateContentSize(content: string): boolean {
  return content.length <= MAX_FILE_SIZE;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const userId = searchParams.get("userId");
    const isPlayground = searchParams.get("playground") === "true";
    const sessionId = searchParams.get("sessionId"); // For playground session isolation
    
    // For playground mode, check localStorage sessionId
    if (isPlayground) {
      // Playground files are stored in-memory or localStorage - return empty for now
      // They'll be managed client-side
      return NextResponse.json({ files: [] });
    }
    
    const { databases, config } = getAppwriteClient();
    
    // Build queries - filter by projectId and userId
    const queries: string[] = [];
    if (projectId) {
      queries.push(`equal("projectId", "${projectId}")`);
    }
    if (userId) {
      queries.push(`equal("userId", "${userId}")`);
    }
    
    const docs = await databases.listDocuments(
      config.databaseId, 
      config.filesCollectionId, 
      queries.length > 0 ? queries : []
    );
    
    let files = (docs.documents || []).map((d: any) => ({ 
      path: d.path as string, 
      content: (d.content ?? "") as string, 
      isFolder: !!d.isFolder,
      projectId: d.projectId || null,
      userId: d.userId || null,
    }));
    
    // Additional filtering for safety
    if (projectId) {
      files = files.filter(f => f.projectId === projectId);
    }
    if (userId) {
      files = files.filter(f => f.userId === userId);
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
    const { action, path, content, isFolder, newPath, projectId, userId, isPlayground, sessionId } = body as { 
      action: "create" | "update" | "delete" | "rename" | "upload"; 
      path: string; 
      content?: string; 
      isFolder?: boolean; 
      newPath?: string; 
      projectId?: string;
      userId?: string | null;
      isPlayground?: boolean;
      sessionId?: string;
    };
    
    // For playground mode, files are managed client-side only (no persistence)
    if (isPlayground) {
      // Return success but don't actually save to database
      return NextResponse.json({ ok: true, id: `playground-${Date.now()}` });
    }

    const { databases, config } = getAppwriteClient();

    if (!path) return NextResponse.json({ error: "Path is required" }, { status: 400 });
    if (!projectId) return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    
    // Security validation for file paths
    if (!validatePath(path)) {
      return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
    }
    
    // Validate extension if it's a file (not folder)
    if (!isFolder && !validateExtension(path)) {
      return NextResponse.json({ error: "File type not allowed. Only code and text files are permitted." }, { status: 400 });
    }
    
    // Validate content size if it's a file
    if (!isFolder && content && !validateContentSize(content)) {
      return NextResponse.json({ error: `File exceeds maximum size of ${MAX_FILE_SIZE / 1024 / 1024}MB` }, { status: 400 });
    }
    
    // Sanitize path
    const sanitizedPath = sanitizePath(path);
    
    // For authenticated users, require userId
    if (!isPlayground && !userId && !projectId.startsWith("playground-")) {
      return NextResponse.json({ error: "User ID is required for authenticated files" }, { status: 400 });
    }

    if (action === "delete") {
      const queries: string[] = [`equal("projectId", "${projectId}")`];
      if (userId) {
        queries.push(`equal("userId", "${userId}")`);
      }
      const list = await databases.listDocuments(config.databaseId, config.filesCollectionId, queries);
      if (isFolder) {
        const toDelete = (list.documents || []).filter((d: any) => 
          (d.path as string).startsWith(sanitizedPath) && d.projectId === projectId && (!userId || d.userId === userId)
        );
        for (const d of toDelete) {
          await databases.deleteDocument(config.databaseId, config.filesCollectionId, d.$id);
        }
      } else {
        const doc = (list.documents || []).find((d: any) => 
          d.path === sanitizedPath && d.projectId === projectId && (!userId || d.userId === userId)
        );
        if (doc) await databases.deleteDocument(config.databaseId, config.filesCollectionId, doc.$id);
      }
      return NextResponse.json({ ok: true });
    }

    if (action === "rename") {
      if (!newPath) return NextResponse.json({ error: "newPath is required for rename" }, { status: 400 });
      
      // Validate new path
      if (!validatePath(newPath)) {
        return NextResponse.json({ error: "Invalid new file path" }, { status: 400 });
      }
      
      // Validate extension if it's a file (not folder)
      if (!isFolder && !validateExtension(newPath)) {
        return NextResponse.json({ error: "File type not allowed. Only code and text files are permitted." }, { status: 400 });
      }
      
      const sanitizedNewPath = sanitizePath(newPath);
      
      const queries: string[] = [`equal("projectId", "${projectId}")`];
      if (userId) {
        queries.push(`equal("userId", "${userId}")`);
      }
      const list = await databases.listDocuments(config.databaseId, config.filesCollectionId, queries);
      if (isFolder) {
        const toMove = (list.documents || []).filter((d: any) => 
          (d.path as string).startsWith(sanitizedPath) && d.projectId === projectId && (!userId || d.userId === userId)
        );
        for (const d of toMove) {
          const suffix = (d.path as string).slice(sanitizedPath.length);
          await databases.updateDocument(config.databaseId, config.filesCollectionId, d.$id, { path: sanitizedNewPath + suffix });
        }
      } else {
        const doc = (list.documents || []).find((d: any) => 
          d.path === sanitizedPath && d.projectId === projectId && (!userId || d.userId === userId)
        );
        if (doc) await databases.updateDocument(config.databaseId, config.filesCollectionId, doc.$id, { path: sanitizedNewPath });
      }
      return NextResponse.json({ ok: true });
    }

    if (!isFolder && !content && content !== "") {
      return NextResponse.json({ error: "Content is required for create/update" }, { status: 400 });
    }

    // Upsert behavior: if exists, update; else, create
    const queries: string[] = [`equal("projectId", "${projectId}")`, `equal("path", "${sanitizedPath}")`];
    if (userId) {
      queries.push(`equal("userId", "${userId}")`);
    }
    const list = await databases.listDocuments(config.databaseId, config.filesCollectionId, queries);
    const existing = (list.documents || []).find((d: any) => 
      d.path === sanitizedPath && d.projectId === projectId && (!userId || d.userId === userId)
    );
    if (existing) {
      const payload: any = isFolder ? { isFolder: true } : { content };
      if (userId) payload.userId = userId; // Ensure userId is set on update
      const updated = await databases.updateDocument(config.databaseId, config.filesCollectionId, existing.$id, payload);
      return NextResponse.json({ ok: true, id: updated.$id });
    } else {
      const payload: any = isFolder 
        ? { path: sanitizedPath, isFolder: true, projectId, ...(userId ? { userId } : {}) } 
        : { path: sanitizedPath, content, projectId, ...(userId ? { userId } : {}) };
      const created = await databases.createDocument(config.databaseId, config.filesCollectionId, "unique()", payload);
      return NextResponse.json({ ok: true, id: created.$id });
    }
  } catch (error) {
    console.error("Failed to apply file action:", error);
    return NextResponse.json({ error: "Failed to apply file action" }, { status: 500 });
  }
}


