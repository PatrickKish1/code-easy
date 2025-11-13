import { NextRequest, NextResponse } from "next/server";
import { getAppwriteClient } from "@/lib/appwrite";
import { Query } from "node-appwrite";
import { getAuthenticatedUserId } from "@/lib/auth-client";
import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";
import * as path from "path";
import { existsSync } from "fs";

const execAsync = promisify(exec);

// Base directory for builder projects
const BUILDER_PROJECTS_DIR = process.env.BUILDER_PROJECTS_DIR || path.join(process.cwd(), ".builder-projects");

// Ensure projects directory exists
async function ensureProjectsDir() {
  if (!existsSync(BUILDER_PROJECTS_DIR)) {
    await fs.mkdir(BUILDER_PROJECTS_DIR, { recursive: true });
  }
}

/**
 * Scaffold a project using the specified framework
 */
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
    const { projectId, description } = body as {
      projectId: string;
      description?: string;
    };

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    const { databases, config } = getAppwriteClient();
    
    // Fetch the project
    let projectDoc;
    try {
      projectDoc = await databases.getDocument(config.databaseId, config.projectsCollectionId, projectId);
      
      // Verify it belongs to the user and is a builder project
      if (projectDoc.userId !== userId || !projectDoc.type || projectDoc.type !== "builder") {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
    } catch (error: any) {
      if (error.code === 404) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
      }
      throw error;
    }

    const framework = projectDoc.framework || "nextjs";
    const projectName = projectDoc.name || `builder-project-${projectId}`;
    const projectDir = path.join(BUILDER_PROJECTS_DIR, projectId);

    await ensureProjectsDir();

    // Update status to "scaffolding"
    await databases.updateDocument(
      config.databaseId,
      config.projectsCollectionId,
      projectId,
      {
        status: "scaffolding",
        updatedAt: new Date().toISOString(),
      }
    );

    // Scaffold based on framework
    let scaffoldCommand: string;
    let needsInstall = true;

    switch (framework) {
      case "nextjs":
        scaffoldCommand = `npx create-next-app@latest ${projectDir} --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --yes`;
        break;
      case "react":
        scaffoldCommand = `npx create-react-app ${projectDir} --template typescript`;
        break;
      case "vue":
        // Vue CLI requires interactive setup, use Vite instead
        scaffoldCommand = `npm create vue@latest ${projectDir} -- --typescript --jsx --router --pinia --vitest --with-tests --yes`;
        needsInstall = false; // create-vue handles install
        break;
      case "angular":
        scaffoldCommand = `npx @angular/cli@latest new ${projectDir} --routing --style=css --skip-git --package-manager npm`;
        needsInstall = false; // Angular CLI handles install
        break;
      case "svelte":
        scaffoldCommand = `npm create svelte@latest ${projectDir}`;
        needsInstall = false; // create-svelte handles install
        break;
      default:
        return NextResponse.json({ error: `Unsupported framework: ${framework}` }, { status: 400 });
    }

    try {
      // Remove directory if it exists
      if (existsSync(projectDir)) {
        await fs.rm(projectDir, { recursive: true, force: true });
      }

      // Run scaffold command
      console.log(`[Scaffold] Running: ${scaffoldCommand}`);
      const { stdout, stderr } = await execAsync(scaffoldCommand, {
        cwd: BUILDER_PROJECTS_DIR,
        maxBuffer: 10 * 1024 * 1024, // 10MB
      });

      console.log(`[Scaffold] Output:`, stdout);
      if (stderr) {
        console.warn(`[Scaffold] Warnings:`, stderr);
      }

      // Install dependencies if needed
      if (needsInstall && existsSync(projectDir)) {
        console.log(`[Scaffold] Installing dependencies...`);
        await execAsync("npm install", {
          cwd: projectDir,
          maxBuffer: 10 * 1024 * 1024,
        });
      }

      // Read scaffolded files and store in Appwrite
      if (existsSync(projectDir)) {
        const files = await readDirectoryRecursive(projectDir);
        
        // Store files in Appwrite
        const filesCollectionId = config.filesCollectionId;
        
        // Delete existing files for this project first
        const existingFiles = await databases.listDocuments(
          config.databaseId,
          filesCollectionId,
          [Query.equal("projectId", projectId)]
        );

        for (const fileDoc of existingFiles.documents) {
          await databases.deleteDocument(config.databaseId, filesCollectionId, fileDoc.$id);
        }

        // Upload new files
        for (const file of files) {
          // Skip node_modules, .git, etc.
          if (shouldIgnoreFile(file.path)) {
            continue;
          }

          const relativePath = path.relative(projectDir, file.path);
          
          try {
            await databases.createDocument(
              config.databaseId,
              filesCollectionId,
              "unique()",
              {
                projectId,
                path: relativePath,
                content: file.content,
                userId: null, // Builder projects don't use userId in files
                encoding: "text",
                mimeType: file.mimeType || "text/plain",
              }
            );
          } catch (error: any) {
            console.error(`Failed to save file ${relativePath}:`, error);
          }
        }
      }

      // Update project status and path
      await databases.updateDocument(
        config.databaseId,
        config.projectsCollectionId,
        projectId,
        {
          status: "ready",
          projectPath: projectDir,
          updatedAt: new Date().toISOString(),
        }
      );

      return NextResponse.json({
        success: true,
        message: `Project scaffolded successfully with ${framework}`,
        projectPath: projectDir,
      });
    } catch (error: any) {
      console.error(`[Scaffold] Error:`, error);
      
      // Update status to error
      await databases.updateDocument(
        config.databaseId,
        config.projectsCollectionId,
        projectId,
        {
          status: "error",
          updatedAt: new Date().toISOString(),
        }
      );

      return NextResponse.json({
        error: "Failed to scaffold project",
        details: error.message || String(error),
        stdout: error.stdout,
        stderr: error.stderr,
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Failed to scaffold project:", error);
    return NextResponse.json({ 
      error: "Failed to scaffold project",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

/**
 * Recursively read directory and return file contents
 */
async function readDirectoryRecursive(dirPath: string): Promise<Array<{ path: string; content: string; mimeType?: string }>> {
  const files: Array<{ path: string; content: string; mimeType?: string }> = [];
  const entries = await fs.readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    
    // Skip ignored directories
    if (shouldIgnoreFile(fullPath)) {
      continue;
    }

    if (entry.isDirectory()) {
      const subFiles = await readDirectoryRecursive(fullPath);
      files.push(...subFiles);
    } else {
      try {
        const content = await fs.readFile(fullPath, "utf-8");
        const mimeType = inferMimeType(fullPath);
        files.push({ path: fullPath, content, mimeType });
      } catch (error) {
        // Skip binary files or files that can't be read
        console.warn(`Skipping file ${fullPath}:`, error);
      }
    }
  }

  return files;
}

/**
 * Check if file/directory should be ignored
 */
function shouldIgnoreFile(filePath: string): boolean {
  const ignorePatterns = [
    /node_modules/,
    /\.git/,
    /\.next/,
    /\.angular/,
    /\.svelte-kit/,
    /dist/,
    /build/,
    /\.env/,
    /\.vscode/,
    /\.idea/,
    /coverage/,
    /\.cache/,
    /package-lock\.json/,
    /yarn\.lock/,
    /pnpm-lock\.yaml/,
  ];

  return ignorePatterns.some(pattern => pattern.test(filePath));
}

/**
 * Infer MIME type from file extension
 */
function inferMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    ".js": "application/javascript",
    ".ts": "application/typescript",
    ".tsx": "application/typescript",
    ".jsx": "application/javascript",
    ".json": "application/json",
    ".css": "text/css",
    ".html": "text/html",
    ".md": "text/markdown",
    ".txt": "text/plain",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
  };
  
  return mimeTypes[ext] || "text/plain";
}

