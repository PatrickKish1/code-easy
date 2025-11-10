import { NextRequest, NextResponse } from "next/server";

type GitHubRequestPayload = {
  repoUrl: string;
  token?: string;
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
    let ref = branch || DEFAULT_BRANCH;

    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      const url = new URL(trimmed);
      const segments = url.pathname.split("/").filter(Boolean);
      if (segments.length < 2) {
        return null;
      }
      [owner, repo] = segments;
      if (segments[2] === "tree" && segments[3]) {
        ref = segments[3];
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

    return { owner, repo, ref };
  } catch (error) {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as GitHubRequestPayload;
    const { repoUrl, token } = payload;

    if (!repoUrl || repoUrl.trim().length === 0) {
      return NextResponse.json({ error: "Repository URL is required" }, { status: 400 });
    }

    const repoInfo = parseRepository(repoUrl);
    if (!repoInfo) {
      return NextResponse.json({ error: "Unable to parse repository URL" }, { status: 400 });
    }

    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
      "User-Agent": "vibecoder-importer",
    };

    if (token && token.trim()) {
      headers.Authorization = `Bearer ${token.trim()}`;
    }

    const branches: string[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore && page <= 5) {
      const response = await fetch(
        `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}/branches?per_page=100&page=${page}`,
        { headers },
      );

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

      const data = (await response.json()) as Array<{ name: string }>;
      if (!Array.isArray(data) || data.length === 0) {
        hasMore = false;
      } else {
        branches.push(...data.map((item) => item.name));
        hasMore = data.length === 100;
        page += 1;
      }
    }

    if (!branches.includes(repoInfo.ref)) {
      branches.unshift(repoInfo.ref);
    }

    const uniqueBranches = Array.from(new Set(branches));

    return NextResponse.json({
      success: true,
      data: {
        branches: uniqueBranches,
      },
    });
  } catch (error) {
    console.error("Failed to fetch GitHub branches:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch branches",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}


