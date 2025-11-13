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
 * Install npm packages in a builder project
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
    const { projectId, packages, dev = false } = body as {
      projectId: string;
      packages: string;
      dev?: boolean;
    };

    if (!projectId || !packages) {
      return NextResponse.json({ error: "Project ID and packages are required" }, { status: 400 });
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

    const projectDir = projectDoc.projectPath || path.join(BUILDER_PROJECTS_DIR, projectId);

    if (!existsSync(projectDir)) {
      return NextResponse.json({ error: "Project directory not found" }, { status: 404 });
    }

    // Parse package names
    const packageList = packages.split(",").map(p => p.trim()).filter(Boolean);
    
    if (packageList.length === 0) {
      return NextResponse.json({ error: "No valid packages provided" }, { status: 400 });
    }

    try {
      // Install packages
      const installCommand = dev
        ? `npm install --save-dev ${packageList.join(" ")}`
        : `npm install ${packageList.join(" ")}`;

      console.log(`[Install Dependencies] Running: ${installCommand}`);
      const { stdout, stderr } = await execAsync(installCommand, {
        cwd: projectDir,
        maxBuffer: 10 * 1024 * 1024, // 10MB
        timeout: 115000, // 115 seconds (just under 120s limit)
      });

      console.log(`[Install Dependencies] Output:`, stdout);
      if (stderr && !stderr.includes("npm WARN")) {
        console.warn(`[Install Dependencies] Warnings:`, stderr);
      }

      return NextResponse.json({
        success: true,
        message: `Successfully installed ${packageList.length} package(s)`,
        packages: packageList,
        dev,
      });
    } catch (error: any) {
      console.error(`[Install Dependencies] Error:`, error);
      
      return NextResponse.json({
        error: "Failed to install dependencies",
        details: error.message || String(error),
        stdout: error.stdout,
        stderr: error.stderr,
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Failed to install dependencies:", error);
    return NextResponse.json({ 
      error: "Failed to install dependencies",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

