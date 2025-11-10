import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";

type GitHubRequestPayload = {
  repoUrl: string;
  branch?: string;
  token?: string;
};

type PendingFile = {
  path: string;
  content: string;
  isFolder: boolean;
  encoding?: "text" | "base64";
  mimeType?: string;
};

const DEFAULT_BRANCH = "main";

function parseRepository(input: string, branch?: string): { owner: string; repo: string; ref: string } | null {
  try {
    const trimmed = input.trim().replace(/\.git$/, "");

    if (!trimmed) {
      return null;
    }

    let owner = "";
    let repo = "";

    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      const url = new URL(trimmed);
      const segments = url.pathname.split("/").filter(Boolean);
      if (segments.length < 2) {
        return null;
      }
      [owner, repo] = segments;
      if (segments[2] === "tree" && segments[3]) {
        branch = segments[3];
      }
    } else {
      const segments = trimmed.split("/").filter(Boolean);
      if (segments.length < 2) {
        return null;
      }
      [owner, repo] = segments;
    }

    if (!owner || !repo) {
      return null;
    }

    return {
      owner,
      repo,
      ref: branch && branch.length > 0 ? branch : DEFAULT_BRANCH,
    };
  } catch (error) {
    return null;
  }
}

function normalizeZipPaths(paths: string[]): string[] {
  if (paths.length === 0) {
    return paths;
  }

  const segments = paths
    .map((path) => path.split("/").filter(Boolean))
    .filter((parts) => parts.length > 0);

  if (segments.length === 0) {
    return paths;
  }

  const rootSegment = segments[0][0];
  const hasCommonRoot = segments.every((parts) => parts[0] === rootSegment);

  if (!hasCommonRoot) {
    return paths;
  }

  return paths
    .map((path) => {
      if (path.startsWith(`${rootSegment}/`)) {
        return path.substring(rootSegment.length + 1);
      }
      if (path === rootSegment) {
        return "";
      }
      return path;
    })
    .filter(Boolean);
}

async function extractZip(buffer: ArrayBuffer): Promise<PendingFile[]> {
  const zip = await JSZip.loadAsync(buffer);
  const allPaths: string[] = [];
  zip.forEach((relativePath) => {
    allPaths.push(relativePath);
  });

  const normalized = normalizeZipPaths(allPaths);
  const pathMap = new Map<string, string>();
  allPaths.forEach((originalPath, index) => {
    const normalizedPath = normalized[index];
    if (normalizedPath !== undefined) {
      pathMap.set(originalPath, normalizedPath.replace(/\/$/, ""));
    }
  });

  const extracted: PendingFile[] = [];
  const folderSet = new Set<string>();

  const inferMimeType = (path: string): string | undefined => {
    const lower = path.toLowerCase();
    if (lower.endsWith(".png")) return "image/png";
    if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
    if (lower.endsWith(".gif")) return "image/gif";
    if (lower.endsWith(".bmp")) return "image/bmp";
    if (lower.endsWith(".ico")) return "image/x-icon";
    if (lower.endsWith(".webp")) return "image/webp";
    if (lower.endsWith(".svg")) return "image/svg+xml";
    if (lower.endsWith(".mp4")) return "video/mp4";
    if (lower.endsWith(".webm")) return "video/webm";
    if (lower.endsWith(".mov")) return "video/quicktime";
    if (lower.endsWith(".mkv")) return "video/x-matroska";
    if (lower.endsWith(".avi")) return "video/x-msvideo";
    if (lower.endsWith(".mp3")) return "audio/mpeg";
    if (lower.endsWith(".wav")) return "audio/wav";
    if (lower.endsWith(".ogg")) return "audio/ogg";
    if (lower.endsWith(".pdf")) return "application/pdf";
    return undefined;
  };

  await Promise.all(
    Object.keys(zip.files).map(async (relativePath) => {
      const entry = zip.files[relativePath];
      if (!entry) {
        return;
      }
      const normalizedPath = pathMap.get(relativePath);
      if (!normalizedPath) {
        return;
      }

      if (entry.dir) {
        if (normalizedPath) {
          folderSet.add(normalizedPath);
        }
        return;
      }

      try {
        const content = await entry.async("string");
        extracted.push({
          path: normalizedPath,
          content,
          isFolder: false,
          encoding: "text",
          mimeType: inferMimeType(normalizedPath),
        });
      } catch (error) {
        const base64 = await entry.async("base64");
        extracted.push({
          path: normalizedPath,
          content: base64,
          isFolder: false,
          encoding: "base64",
          mimeType: inferMimeType(normalizedPath),
        });
      }
    }),
  );

  folderSet.forEach((folder) => {
    extracted.push({
      path: folder,
      content: "",
      isFolder: true,
    });
  });

  const deduped = new Map<string, PendingFile>();
  extracted
    .filter((entry) => entry.path.length > 0)
    .forEach((entry) => deduped.set(entry.path, entry));

  return Array.from(deduped.values()).sort((a, b) => a.path.localeCompare(b.path));
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as GitHubRequestPayload;
    const { repoUrl, branch, token } = payload;

    if (!repoUrl || repoUrl.trim().length === 0) {
      return NextResponse.json({ error: "Repository URL is required" }, { status: 400 });
    }

    const repoInfo = parseRepository(repoUrl, branch);
    if (!repoInfo) {
      return NextResponse.json({ error: "Unable to parse repository URL" }, { status: 400 });
    }

    const zipUrl = `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}/zipball/${repoInfo.ref}`;
    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
      "User-Agent": "vibecoder-importer",
    };

    if (token && token.trim()) {
      headers.Authorization = `Bearer ${token.trim()}`;
    }

    const response = await fetch(zipUrl, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return NextResponse.json(
        {
          error: `GitHub API responded with ${response.status}`,
          details: errorBody,
          status: response.status,
        },
        { status: response.status },
      );
    }

    const buffer = await response.arrayBuffer();
    const files = await extractZip(buffer);

    return NextResponse.json({
      success: true,
      data: {
        files,
        repository: {
          owner: repoInfo.owner,
          name: repoInfo.repo,
          branch: repoInfo.ref,
        },
      },
    });
  } catch (error) {
    console.error("GitHub import failed:", error);
    return NextResponse.json(
      {
        error: "Failed to import repository",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}


