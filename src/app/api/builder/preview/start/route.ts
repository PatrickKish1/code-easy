import { NextRequest, NextResponse } from "next/server";
import { getAppwriteClient } from "@/lib/appwrite";
import { Query } from "node-appwrite";
import { getAuthenticatedUserId } from "@/lib/auth-client";
import { exec } from "child_process";
import { promisify } from "util";
import * as path from "path";
import { existsSync } from "fs";

const execAsync = promisify(exec);

// Base directory for builder projects
const BUILDER_PROJECTS_DIR = process.env.BUILDER_PROJECTS_DIR || path.join(process.cwd(), ".builder-projects");

// Store running preview servers
const previewServers = new Map<string, { port: number; process: any }>();

// Find available port starting from 3000
async function findAvailablePort(startPort: number = 3000): Promise<number> {
  // Simple implementation - in production, you'd want to actually check if port is available
  // For now, just use projectId hash to get a unique port
  return startPort;
}

/**
 * Start a preview server for a builder project
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
    const { projectId } = body as {
      projectId: string;
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

    // Check if preview is already running
    if (previewServers.has(projectId)) {
      const existing = previewServers.get(projectId)!;
      return NextResponse.json({
        success: true,
        message: "Preview server already running",
        previewUrl: `http://localhost:${existing.port}`,
        previewPort: existing.port,
      });
    }

    const framework = projectDoc.framework || "nextjs";
    const projectDir = projectDoc.projectPath || path.join(BUILDER_PROJECTS_DIR, projectId);

    if (!existsSync(projectDir)) {
      return NextResponse.json({ error: "Project directory not found" }, { status: 404 });
    }

    try {
      // Generate a port based on projectId (simple hash)
      const portHash = projectId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const previewPort = 3000 + (portHash % 9000); // Ports 3000-11999

      // Determine dev command based on framework
      let devCommand: string;
      switch (framework) {
        case "nextjs":
          devCommand = `npm run dev -- --port ${previewPort}`;
          break;
        case "react":
          devCommand = `PORT=${previewPort} npm start`;
          break;
        case "vue":
          devCommand = `npm run dev -- --port ${previewPort}`;
          break;
        case "angular":
          devCommand = `ng serve --port ${previewPort}`;
          break;
        case "svelte":
          devCommand = `npm run dev -- --port ${previewPort}`;
          break;
        default:
          return NextResponse.json({ error: `Unsupported framework: ${framework}` }, { status: 400 });
      }

      console.log(`[Preview] Starting dev server: ${devCommand}`);
      
      // Start dev server in background
      const childProcess = exec(devCommand, {
        cwd: projectDir,
        maxBuffer: 10 * 1024 * 1024,
      });

      // Store process info
      previewServers.set(projectId, {
        port: previewPort,
        process: childProcess,
      });

      // Cleanup on process exit
      childProcess.on("exit", () => {
        previewServers.delete(projectId);
      });

      // Wait a bit for server to start (in production, poll until ready)
      await new Promise(resolve => setTimeout(resolve, 3000));

      const previewUrl = `http://localhost:${previewPort}`;

      // Update project with preview info
      await databases.updateDocument(
        config.databaseId,
        config.projectsCollectionId,
        projectId,
        {
          previewUrl,
          previewPort,
          updatedAt: new Date().toISOString(),
        }
      );

      return NextResponse.json({
        success: true,
        message: "Preview server started",
        previewUrl,
        previewPort,
      });
    } catch (error: any) {
      console.error(`[Preview] Error:`, error);
      
      // Cleanup on error
      previewServers.delete(projectId);

      return NextResponse.json({
        error: "Failed to start preview server",
        details: error.message || String(error),
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Failed to start preview server:", error);
    return NextResponse.json({ 
      error: "Failed to start preview server",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

