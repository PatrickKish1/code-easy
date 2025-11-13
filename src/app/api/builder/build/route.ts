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

/**
 * Build a builder project for production
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

    const framework = projectDoc.framework || "nextjs";
    const projectDir = projectDoc.projectPath || path.join(BUILDER_PROJECTS_DIR, projectId);

    if (!existsSync(projectDir)) {
      return NextResponse.json({ error: "Project directory not found" }, { status: 404 });
    }

    try {
      // Update status to "building"
      await databases.updateDocument(
        config.databaseId,
        config.projectsCollectionId,
        projectId,
        {
          status: "building",
          updatedAt: new Date().toISOString(),
        }
      );

      // Determine build command based on framework
      let buildCommand: string;
      switch (framework) {
        case "nextjs":
          buildCommand = "npm run build";
          break;
        case "react":
          buildCommand = "npm run build";
          break;
        case "vue":
          buildCommand = "npm run build";
          break;
        case "angular":
          buildCommand = "npm run build";
          break;
        case "svelte":
          buildCommand = "npm run build";
          break;
        default:
          return NextResponse.json({ error: `Unsupported framework: ${framework}` }, { status: 400 });
      }

      console.log(`[Build] Running: ${buildCommand}`);
      const { stdout, stderr } = await execAsync(buildCommand, {
        cwd: projectDir,
        maxBuffer: 10 * 1024 * 1024, // 10MB
        timeout: 115000, // 115 seconds (just under 120s limit)
      });

      console.log(`[Build] Output:`, stdout);
      if (stderr && !stderr.includes("npm WARN") && !stderr.includes("warning")) {
        console.warn(`[Build] Warnings:`, stderr);
      }

      // Update status to "ready"
      await databases.updateDocument(
        config.databaseId,
        config.projectsCollectionId,
        projectId,
        {
          status: "ready",
          updatedAt: new Date().toISOString(),
        }
      );

      return NextResponse.json({
        success: true,
        message: `Project built successfully with ${framework}`,
        framework,
      });
    } catch (error: any) {
      console.error(`[Build] Error:`, error);
      
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
        error: "Failed to build project",
        details: error.message || String(error),
        stdout: error.stdout,
        stderr: error.stderr,
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Failed to build project:", error);
    return NextResponse.json({ 
      error: "Failed to build project",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

