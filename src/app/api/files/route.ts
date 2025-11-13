import { NextRequest, NextResponse } from "next/server";
import { getAppwriteClient, ProjectFileDoc } from "@/lib/appwrite";
import { Query } from "node-appwrite";

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
    const path = searchParams.get("path");
    
    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }
    
    const { databases, config } = getAppwriteClient();
    
    // Build queries - filter by projectId (playground projects are stored in DB too)
    const queries: string[] = [Query.equal("projectId", projectId)];
    
    // Optional: filter by userId if provided (for authenticated users)
    // For playground projects, userId may be null, so we don't filter by it
    if (userId) {
      queries.push(Query.equal("userId", userId));
    }
    
    // Optional: filter by specific path
    if (path) {
      queries.push(Query.equal("path", path));
    }
    
    const docs = await databases.listDocuments(
      config.databaseId, 
      config.filesCollectionId, 
      queries
    );
    
    let files = (docs.documents || []).map((d: any) => ({ 
      path: d.path as string, 
      content: (d.content ?? "") as string, 
      encoding: d.encoding || "text",
      mimeType: d.mimeType || null,
      isFolder: !!d.isFolder,
      projectId: d.projectId || null,
      userId: d.userId || null,
    }));
    
    // Additional filtering for safety
    files = files.filter(f => f.projectId === projectId);
    
    return NextResponse.json({ files });
  } catch (error) {
    console.error("Failed to list files:", error);
    return NextResponse.json({ error: "Failed to list files" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, path, content, isFolder, newPath, projectId, userId, encoding, mimeType } = body as { 
      action: "create" | "update" | "delete" | "rename" | "upload"; 
      path: string; 
      content?: string; 
      isFolder?: boolean; 
      newPath?: string; 
      projectId?: string;
      userId?: string | null;
      encoding?: "text" | "base64";
      mimeType?: string;
    };

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
    
    // Playground projects can have null userId, authenticated projects require userId
    const isPlaygroundProject = projectId.startsWith("playground-");
    if (!isPlaygroundProject && !userId) {
      // For non-playground projects, userId is required
      // But we'll allow it to be null for backward compatibility
      console.warn("No userId provided for non-playground project:", projectId);
    }

    if (action === "delete") {
      const queries: string[] = [Query.equal("projectId", projectId)];
      // For playground projects, don't filter by userId
      if (userId && !isPlaygroundProject) {
        queries.push(Query.equal("userId", userId));
      }
      const list = await databases.listDocuments(config.databaseId, config.filesCollectionId, queries);
      if (isFolder) {
        const toDelete = (list.documents || []).filter((d: any) => 
          (d.path as string).startsWith(sanitizedPath) && d.projectId === projectId && (isPlaygroundProject || !userId || d.userId === userId)
        );
        for (const d of toDelete) {
          await databases.deleteDocument(config.databaseId, config.filesCollectionId, d.$id);
        }
      } else {
        const doc = (list.documents || []).find((d: any) => 
          d.path === sanitizedPath && d.projectId === projectId && (isPlaygroundProject || !userId || d.userId === userId)
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
      
      const queries: string[] = [Query.equal("projectId", projectId)];
      // For playground projects, don't filter by userId
      if (userId && !isPlaygroundProject) {
        queries.push(Query.equal("userId", userId));
      }
      const list = await databases.listDocuments(config.databaseId, config.filesCollectionId, queries);
      if (isFolder) {
        const toMove = (list.documents || []).filter((d: any) => 
          (d.path as string).startsWith(sanitizedPath) && d.projectId === projectId && (isPlaygroundProject || !userId || d.userId === userId)
        );
        for (const d of toMove) {
          const suffix = (d.path as string).slice(sanitizedPath.length);
          await databases.updateDocument(config.databaseId, config.filesCollectionId, d.$id, { path: sanitizedNewPath + suffix });
        }
      } else {
        const doc = (list.documents || []).find((d: any) => 
          d.path === sanitizedPath && d.projectId === projectId && (isPlaygroundProject || !userId || d.userId === userId)
        );
        if (doc) await databases.updateDocument(config.databaseId, config.filesCollectionId, doc.$id, { path: sanitizedNewPath });
      }
      return NextResponse.json({ ok: true });
    }

    if (!isFolder && !content && content !== "") {
      return NextResponse.json({ error: "Content is required for create/update" }, { status: 400 });
    }

    // Upsert behavior: if exists, update; else, create
    const queries: string[] = [
      Query.equal("projectId", projectId),
      Query.equal("path", sanitizedPath),
    ];
    // For playground projects, don't filter by userId (it may be null)
    // For authenticated projects, filter by userId if provided
    if (userId && !isPlaygroundProject) {
      queries.push(Query.equal("userId", userId));
    }
    const list = await databases.listDocuments(config.databaseId, config.filesCollectionId, queries);
    const existing = (list.documents || []).find((d: any) => 
      d.path === sanitizedPath && d.projectId === projectId && (isPlaygroundProject || !userId || d.userId === userId)
    );
    if (existing) {
      const payload: any = isFolder 
        ? { isFolder: true } 
        : { 
            content, 
            ...(encoding ? { encoding } : {}),
            ...(mimeType ? { mimeType } : {}),
          };
      // Only set userId if it was provided (for authenticated users)
      if (userId) payload.userId = userId;
      const updated = await databases.updateDocument(config.databaseId, config.filesCollectionId, existing.$id, payload);
      return NextResponse.json({ ok: true, id: updated.$id });
    } else {
      const payload: any = isFolder 
        ? { 
            path: sanitizedPath, 
            isFolder: true, 
            projectId, 
            ...(userId ? { userId } : {}) 
          } 
        : { 
            path: sanitizedPath, 
            content, 
            projectId, 
            ...(encoding ? { encoding } : {}),
            ...(mimeType ? { mimeType } : {}),
            ...(userId ? { userId } : {}) 
          };
      const created = await databases.createDocument(config.databaseId, config.filesCollectionId, "unique()", payload);
      return NextResponse.json({ ok: true, id: created.$id });
    }
  } catch (error) {
    console.error("Failed to apply file action:", error);
    return NextResponse.json({ error: "Failed to apply file action" }, { status: 500 });
  }
}


