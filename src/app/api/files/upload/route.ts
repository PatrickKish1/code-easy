import { NextRequest, NextResponse } from "next/server";
import { getAppwriteClient } from "@/lib/appwrite";

// Security configuration
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB max file size
const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB max total upload size
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

// Helper function to read file as text with size validation
async function readFileAsText(file: File): Promise<string> {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File ${file.name} exceeds maximum size of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

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

// Helper to process directory structure
function processDirectoryEntries(
  entries: FileSystemEntry[],
  basePath: string,
  files: Array<{ path: string; content: string; isFolder: boolean }>,
  projectId: string,
  userId?: string | null
): Promise<void> {
  return new Promise((resolve, reject) => {
    let pending = entries.length;
    if (pending === 0) {
      resolve();
      return;
    }

    entries.forEach((entry) => {
      if (entry.isFile) {
        (entry as FileSystemFileEntry).file((file: File) => {
          readFileAsText(file).then((content) => {
            files.push({
              path: basePath ? `${basePath}/${file.name}` : file.name,
              content,
              isFolder: false,
            });
            pending--;
            if (pending === 0) resolve();
          }).catch(reject);
        });
      } else if (entry.isDirectory) {
        const dirEntry = entry as FileSystemDirectoryEntry;
        files.push({
          path: basePath ? `${basePath}/${dirEntry.name}` : dirEntry.name,
          content: "",
          isFolder: true,
        });
        dirEntry.createReader().readEntries((subEntries) => {
          processDirectoryEntries(
            subEntries,
            basePath ? `${basePath}/${dirEntry.name}` : dirEntry.name,
            files,
            projectId,
            userId
          ).then(() => {
            pending--;
            if (pending === 0) resolve();
          }).catch(reject);
        });
      }
    });
  });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const projectId = formData.get("projectId") as string;
    const userId = formData.get("userId") as string | null;
    const isPlayground = formData.get("playground") === "true";
    
    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    // For playground mode, return file structure but don't persist
    if (isPlayground) {
      const files: Array<{ path: string; content: string; isFolder: boolean }> = [];
      // Process uploaded files from FormData
      const fileEntries = Array.from(formData.entries()).filter(([key]) => key !== "projectId" && key !== "userId" && key !== "playground");
      let totalSize = 0;
      
      for (const [path, value] of fileEntries) {
        if (value instanceof File) {
          // Security validations
          if (!validateExtension(value.name)) {
            return NextResponse.json({ 
              error: `File type not allowed: ${value.name}. Only code and text files are permitted.` 
            }, { status: 400 });
          }
          
          if (!validatePath(path as string)) {
            return NextResponse.json({ 
              error: `Invalid file path: ${path}` 
            }, { status: 400 });
          }
          
          totalSize += value.size;
          if (totalSize > MAX_TOTAL_SIZE) {
            return NextResponse.json({ 
              error: `Total upload size exceeds ${MAX_TOTAL_SIZE / 1024 / 1024}MB limit` 
            }, { status: 400 });
          }
          
          const content = await readFileAsText(value);
          files.push({
            path: sanitizePath(path as string),
            content,
            isFolder: false,
          });
        }
      }
      
      return NextResponse.json({ files });
    }

    const { databases, config } = getAppwriteClient();
    const files: Array<{ path: string; content: string; isFolder: boolean }> = [];
    let totalSize = 0;
    
    // Process files from FormData with security validations
    for (const [key, value] of formData.entries()) {
      if (key === "projectId" || key === "userId" || key === "playground") continue;
      
      if (value instanceof File) {
        // Security validations
        if (!validateExtension(value.name)) {
          return NextResponse.json({ 
            error: `File type not allowed: ${value.name}. Only code and text files are permitted.` 
          }, { status: 400 });
        }
        
        if (!validatePath(key)) {
          return NextResponse.json({ 
            error: `Invalid file path: ${key}` 
          }, { status: 400 });
        }
        
        totalSize += value.size;
        if (totalSize > MAX_TOTAL_SIZE) {
          return NextResponse.json({ 
            error: `Total upload size exceeds ${MAX_TOTAL_SIZE / 1024 / 1024}MB limit` 
          }, { status: 400 });
        }
        
        const content = await readFileAsText(value);
        files.push({
          path: sanitizePath(key),
          content,
          isFolder: false,
        });
      }
    }

    // Save files to database
    const savedFiles = [];
    for (const file of files) {
      const payload: any = {
        path: file.path,
        content: file.content,
        projectId,
        isFolder: file.isFolder,
        ...(userId ? { userId } : {}),
      };

      // Check if file exists
      const queries = [
        `equal("projectId", "${projectId}")`,
        `equal("path", "${file.path}")`,
        ...(userId ? [`equal("userId", "${userId}")`] : []),
      ];
      
      const existing = await databases.listDocuments(config.databaseId, config.filesCollectionId, queries);
      const existingDoc = existing.documents?.[0];
      
      if (existingDoc) {
        await databases.updateDocument(config.databaseId, config.filesCollectionId, existingDoc.$id, payload);
        savedFiles.push({ ...file, id: existingDoc.$id });
      } else {
        const created = await databases.createDocument(config.databaseId, config.filesCollectionId, "unique()", payload);
        savedFiles.push({ ...file, id: created.$id });
      }
    }

    return NextResponse.json({ files: savedFiles, count: savedFiles.length });
  } catch (error: any) {
    console.error("Failed to upload files:", error);
    return NextResponse.json({ error: error.message || "Failed to upload files" }, { status: 500 });
  }
}

