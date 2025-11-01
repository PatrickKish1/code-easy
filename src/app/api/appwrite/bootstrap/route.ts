import { NextRequest, NextResponse } from "next/server";
import { getAppwriteClient } from "@/lib/appwrite";
import { ID, Permission, Role } from "node-appwrite";

export async function GET() {
  try {
    const { config, databases } = getAppwriteClient();
    const result: any = {
      databaseId: config.databaseId || null,
      filesCollectionId: config.filesCollectionId || null,
      projectsCollectionId: config.projectsCollectionId || null,
      exists: { database: false, files: false, projects: false },
    };

    if (config.databaseId) {
      try {
        const db = await databases.get(config.databaseId);
        result.exists.database = !!db;
      } catch {}
    }

    if (config.databaseId && config.filesCollectionId) {
      try {
        const col = await databases.getCollection(config.databaseId, config.filesCollectionId);
        result.exists.files = !!col;
      } catch {}
    }

    if (config.databaseId && config.projectsCollectionId) {
      try {
        const col = await databases.getCollection(config.databaseId, config.projectsCollectionId);
        result.exists.projects = !!col;
      } catch {}
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Bootstrap GET error:", error);
    return NextResponse.json({ error: "Failed to inspect Appwrite setup" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { databases, config } = getAppwriteClient();
    const body = await request.json().catch(() => ({}));
    const namePrefix = body.namePrefix || "VibeCoder";

    // 1) Ensure database
    let databaseId = config.databaseId;
    if (!databaseId) {
      databaseId = (await databases.create(ID.unique(), `${namePrefix} DB`)).$id;
    } else {
      try { await databases.get(databaseId); } catch { databaseId = (await databases.create(databaseId, `${namePrefix} DB`)).$id; }
    }

    // 2) Ensure projects collection
    let projectsCollectionId = config.projectsCollectionId;
    if (!projectsCollectionId) {
      projectsCollectionId = (await databases.createCollection(
        databaseId,
        ID.unique(),
        `${namePrefix} Projects`,
        [Permission.read(Role.any()), Permission.update(Role.any())],
        true,
        true,
      )).$id;
    } else {
      try { await databases.getCollection(databaseId, projectsCollectionId); } catch {
        projectsCollectionId = (await databases.createCollection(
          databaseId,
          projectsCollectionId,
          `${namePrefix} Projects`,
          [Permission.read(Role.any()), Permission.update(Role.any())],
          true,
          true,
        )).$id;
      }
    }
    // Project attributes
    await safeCreateStringAttr(databases, databaseId, projectsCollectionId, "name", 256, true);
    await safeCreateStringAttr(databases, databaseId, projectsCollectionId, "activeFilePath", 1024, false);
    await safeCreateStringAttr(databases, databaseId, projectsCollectionId, "createdAt", 64, true);
    await safeCreateStringAttr(databases, databaseId, projectsCollectionId, "updatedAt", 64, true);
    await safeCreateStringAttr(databases, databaseId, projectsCollectionId, "openFilePaths", 1024, false, "", true);
    await safeCreateStringAttr(databases, databaseId, projectsCollectionId, "dirtyFiles", 1024, false, "", true);

    // 3) Ensure files collection
    let filesCollectionId = config.filesCollectionId;
    if (!filesCollectionId) {
      filesCollectionId = (await databases.createCollection(
        databaseId,
        ID.unique(),
        `${namePrefix} Files`,
        [Permission.read(Role.any()), Permission.update(Role.any())],
        true,
        true,
      )).$id;
    } else {
      try { await databases.getCollection(databaseId, filesCollectionId); } catch {
        filesCollectionId = (await databases.createCollection(
          databaseId,
          filesCollectionId,
          `${namePrefix} Files`,
          [Permission.read(Role.any()), Permission.update(Role.any())],
          true,
          true,
        )).$id;
      }
    }
    // File attributes
    await safeCreateStringAttr(databases, databaseId, filesCollectionId, "projectId", 64, true);
    await safeCreateStringAttr(databases, databaseId, filesCollectionId, "path", 1024, true);
    await safeCreateBoolAttr(databases, databaseId, filesCollectionId, "isFolder", false, false);
    await safeCreateStringAttr(databases, databaseId, filesCollectionId, "content", 65535, false, "");

    return NextResponse.json({
      ok: true,
      databaseId,
      filesCollectionId,
      projectsCollectionId,
      note: "Copy these IDs into your .env as APPWRITE_DATABASE_ID, APPWRITE_FILES_COLLECTION_ID, APPWRITE_PROJECTS_COLLECTION_ID",
    });
  } catch (error) {
    console.error("Bootstrap POST error:", error);
    return NextResponse.json({ error: "Failed to bootstrap Appwrite" }, { status: 500 });
  }
}

async function safeCreateStringAttr(
  databases: any,
  dbId: string,
  colId: string,
  key: string,
  size: number,
  required: boolean,
  defaultValue: string | undefined = undefined,
  array = false
) {
  try {
    await databases.getAttribute(dbId, colId, key);
  } catch {
    if (array) {
      // Appwrite does not allow defaults on array attributes
      await databases.createStringAttribute(dbId, colId, key, size, required, undefined, true, false);
    } else {
      await databases.createStringAttribute(dbId, colId, key, size, required, defaultValue, false, false);
    }
  }
}

async function safeCreateBoolAttr(databases: any, dbId: string, colId: string, key: string, required: boolean, defaultValue: boolean) {
  try {
    await databases.getAttribute(dbId, colId, key);
  } catch {
    await databases.createBooleanAttribute(dbId, colId, key, required, defaultValue, false);
  }
}


