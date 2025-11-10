"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { TopBar, ProjectSidebar, CodeEditor, TabsBar } from "@/components/ide";
import { CallPanel } from "@/components/CallPanel";
import { FileUpload } from "@/components/FileUpload";
import { LoginDialog } from "@/components/auth/LoginDialog";
import {
  Project,
  createDefaultProject,
  deleteFile as deleteProjectFile,
  readProjectsFromStorage,
  setActiveFile,
  upsertFile,
  upsertProject,
  writeProjectsToStorage,
  createFolder,
  renameFile,
  renameFolder,
  markDirty,
  saveFile,
  generateUuid,
  readPlaygroundProjects,
  writePlaygroundProjects,
  pruneExpiredPlaygroundProjects,
  PLAYGROUND_TTL,
} from "@/lib/projects";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, User, Play, Lock } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export default function Home() {
  const router = useRouter();
  const { user, isLoading: authLoading, isPlayground, sessionToken, logout, setPlaygroundMode } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [isCalling, setIsCalling] = useState(false);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const sidebarWidthPrefKey = "vibecoder.sidebarWidth";
  const sidebarMinWidth = 220;
  const sidebarMaxWidth = 480;
  const quotaWarningShownRef = useRef(false);

  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    if (typeof window === "undefined") return 256;
    const stored = window.localStorage.getItem(sidebarWidthPrefKey);
    const parsed = stored ? parseInt(stored, 10) : NaN;
    if (!Number.isFinite(parsed)) {
      return 256;
    }
    return Math.min(sidebarMaxWidth, Math.max(sidebarMinWidth, parsed));
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(sidebarWidthPrefKey, String(sidebarWidth));
  }, [sidebarWidth]);
  useEffect(() => {
    if (!isPlayground) {
      return;
    }

    pruneExpiredPlaygroundProjects();
    const stored = readPlaygroundProjects();

    if (stored.length > 0) {
      const sorted = [...stored].sort((a, b) => b.updatedAt - a.updatedAt);
      setProjects(sorted);
      setProject(sorted[0]);
      return;
    }

    const fresh = createDefaultProject("Playground");
    fresh.id = `playground-${generateUuid()}`;
    fresh.files = [];
    fresh.activeFilePath = undefined;
    fresh.openFilePaths = [];
    fresh.isPlayground = true;
    fresh.expiresAt = Date.now() + PLAYGROUND_TTL;

    const success = writePlaygroundProjects([fresh]);
    if (!success && !quotaWarningShownRef.current) {
      quotaWarningShownRef.current = true;
      toast.warning(
        "Playground session is too large to autosave. We'll keep it in memory for now, but it won't persist after refresh.",
      );
    }
    setProjects([fresh]);
    setProject(fresh);
  }, [isPlayground]);

  // Load projects when auth state changes
  useEffect(() => {
    if (!authLoading) {
      loadProjectsFromAppwrite();
    }
  }, [authLoading, user, isPlayground]);

  async function loadProjectsFromAppwrite() {
    // For playground mode, don't load from server
    if (isPlayground) {
      return;
    }

    try {
      const url = user?.id 
        ? `/api/projects?userId=${encodeURIComponent(user.id)}`
        : "/api/projects";
      const response = await fetch(url, {
        headers: {
          ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
        },
      });
      const data = await response.json();
      if (data.projects && data.projects.length > 0) {
        const normalized = data.projects.map((p: Project) => ({
          ...p,
          files: p.files || [],
          openFilePaths: p.openFilePaths || [],
          dirtyFiles: p.dirtyFiles || [],
        }));
        setProjects(normalized);
        
        // Load files for the first project
        const firstProject = normalized[0];
        try {
          const filesResponse = await fetch(`/api/files?projectId=${firstProject.id}`);
          const filesData = await filesResponse.json();
          if (filesData.files) {
            const projectWithFiles = {
              ...firstProject,
              files: filesData.files
                .filter((f: any) => !f.isFolder)
                .map((f: any) => ({ path: f.path, content: f.content || "" })),
            };
            setProject(projectWithFiles);
            setProjects([projectWithFiles, ...normalized.slice(1)]);
          } else {
            setProject({ ...firstProject, files: [] });
          }
        } catch (filesError) {
          console.error("Failed to load files:", filesError);
          setProject({ ...firstProject, files: [] });
        }
      } else {
        // Create default project if none exist (only for authenticated users)
        if (user?.id) {
          const response = await fetch("/api/projects", {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
            },
            body: JSON.stringify({ name: "Welcome Project", userId: user.id })
          });
          const data = await response.json();
          if (data.project) {
            const projectWithFiles = { ...data.project, files: [] };
            setProjects([projectWithFiles]);
            setProject(projectWithFiles);
            router.push(`/${data.project.id}`);
          }
        }
      }
    } catch (error) {
      console.error("Failed to load projects:", error);
      // Fallback to local storage
      const existing = readProjectsFromStorage();
      if (existing.length === 0) {
        const created = createDefaultProject("Welcome Project");
        setProjects([created]);
        setProject(created);
        writeProjectsToStorage([created]);
      } else {
        const normalized = existing.map((p: Project) => ({
          ...p,
          files: p.files || [],
          openFilePaths: p.openFilePaths || [],
          dirtyFiles: p.dirtyFiles || [],
        }));
        setProjects(normalized);
        setProject(normalized[0]);
      }
    }
  }

  // Realtime sync with webhook-applied changes (voice agent)
  useEffect(() => {
    const es = new EventSource('/api/realtime');
    const onCreated = (e: MessageEvent) => {
      try {
        const data = JSON.parse((e as any).data);
        if (!project || data.projectId !== project.id) return;
        const next = upsertFile(project, data.path, data.content ?? "");
        persist(next);
      } catch {}
    };
    const onUpdated = (e: MessageEvent) => {
      try {
        const data = JSON.parse((e as any).data);
        if (!project || data.projectId !== project.id) return;
        const next = upsertFile(project, data.path, data.content ?? "");
        persist(next);
      } catch {}
    };
    const onRenamed = (e: MessageEvent) => {
      try {
        const data = JSON.parse((e as any).data);
        if (!project || data.projectId !== project.id) return;
        const next = renameFile(project, data.oldPath, data.newPath);
        persist(next);
      } catch {}
    };
    const onDeleted = (e: MessageEvent) => {
      try {
        const data = JSON.parse((e as any).data);
        if (!project || data.projectId !== project.id) return;
        const next = deleteProjectFile(project, data.path);
        persist(next);
      } catch {}
    };
    es.addEventListener('file:created', onCreated as any);
    es.addEventListener('file:updated', onUpdated as any);
    es.addEventListener('file:renamed', onRenamed as any);
    es.addEventListener('file:deleted', onDeleted as any);
    return () => {
      try { es.close(); } catch {}
    };
  }, [project]);

  const activeFile = useMemo(() => {
    if (!project || !project.activeFilePath || !project.files) return undefined;
    return project.files.find(f => f.path === project.activeFilePath);
  }, [project]);
  const openTabs = project?.openFilePaths || (project?.activeFilePath ? [project.activeFilePath] : []);

  const handleSidebarResizeStart = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = sidebarWidth;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const delta = moveEvent.clientX - startX;
      const next = Math.min(sidebarMaxWidth, Math.max(sidebarMinWidth, startWidth + delta));
      setSidebarWidth(next);
    };

    const handlePointerUp = () => {
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  }, [sidebarWidth, sidebarMaxWidth, sidebarMinWidth]);

  async function persist(next: Project) {
    if (isPlayground) {
      const withMeta: Project = {
        ...next,
        isPlayground: true,
        expiresAt: Date.now() + PLAYGROUND_TTL,
      };

      setProject(withMeta);

      const existing = readPlaygroundProjects();
      const updated = upsertProject(existing, withMeta).map((proj) =>
        proj.id === withMeta.id ? withMeta : { ...proj, isPlayground: true },
      );
      const sorted = updated.sort((a, b) => b.updatedAt - a.updatedAt);
      setProjects(sorted);
      const success = writePlaygroundProjects(sorted);
      if (!success && !quotaWarningShownRef.current) {
        quotaWarningShownRef.current = true;
        toast.warning(
          "Playground session is too large to autosave. We'll keep it in memory for now, but it won't persist after refresh.",
        );
      }
      return;
    }

    const normalized: Project = { ...next, isPlayground: false, expiresAt: undefined };
    setProject(normalized);

    const updated = upsertProject(projects, normalized);
    setProjects(updated);
    writeProjectsToStorage(updated);
    
    if (user?.id) {
      try {
        await fetch("/api/projects", {
          method: "PUT",
          headers: { 
            "Content-Type": "application/json",
            ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
          },
          body: JSON.stringify({ 
            id: normalized.id,
            name: normalized.name,
            activeFilePath: normalized.activeFilePath,
            openFilePaths: normalized.openFilePaths,
            dirtyFiles: normalized.dirtyFiles,
          })
        });
      } catch (error) {
        console.error("Failed to sync project to Appwrite:", error);
      }
    }
  }

  async function handleCreateProject() {
    if (isPlayground) {
      const newSessionId = `playground-${generateUuid()}`;
      const fresh = createDefaultProject("Playground");
      fresh.id = newSessionId;
      fresh.files = [];
      fresh.activeFilePath = undefined;
      fresh.openFilePaths = [];
      fresh.isPlayground = true;
      fresh.expiresAt = Date.now() + PLAYGROUND_TTL;

      const existing = readPlaygroundProjects();
      const updatedList = upsertProject(existing, fresh).map((proj) =>
        proj.id === fresh.id ? fresh : { ...proj, isPlayground: true },
      );
      const sorted = updatedList.sort((a, b) => b.updatedAt - a.updatedAt);

      const success = writePlaygroundProjects(sorted);
      if (!success && !quotaWarningShownRef.current) {
        quotaWarningShownRef.current = true;
        toast.warning(
          "Playground session is too large to autosave. We'll keep it in memory for now, but it won't persist after refresh.",
        );
      }
      setProjects(sorted);
      setProject(fresh);
      router.push(`/${fresh.id}`);
      return;
    }

    if (!user?.id) {
      setLoginDialogOpen(true);
      return;
    }

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
        },
        body: JSON.stringify({ name: "New Project", userId: user.id })
      });
      const data = await response.json();
      if (data.project) {
        const projectWithFiles = { ...data.project, files: [] };
        const updated = [projectWithFiles, ...projects];
        setProjects(updated);
        if (!isPlayground) {
          writeProjectsToStorage(updated);
        }
        setProject(projectWithFiles);
        router.push(`/${data.project.id}`);
      }
    } catch (error) {
      console.error("Failed to create project:", error);
    toast.error("Failed to create project. Please try again.");
    }
  }

  function handleOpenProject() {
    if (projects.length <= 1) return;
    const idx = projects.findIndex(pr => pr.id === project?.id);
    const next = projects[(idx + 1) % projects.length];
    setProject(next);
    router.push(`/${next.id}`);
  }

  function handleRenameProject() {
    if (!project) return;
    const name = prompt("Project name", project.name) || project.name;
    persist({ ...project, name });
  }

  function handleSelectFile(path: string) {
    if (!project) return;
    persist(setActiveFile(project, path));
  }

  async function handleDeleteFile(path: string) {
    if (!project) return;
    const next = deleteProjectFile(project, path);
    persist(next);
    if (!isPlayground && user?.id) {
      try {
        await fetch("/api/files", { 
          method: "POST", 
          headers: { 
            "Content-Type": "application/json",
            ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
          }, 
          body: JSON.stringify({ 
            action: "delete", 
            path, 
            projectId: project.id,
            userId: user.id,
          }) 
        });
      } catch {}
    }
  }

  async function handleCreateFile(path: string) {
    if (!project) return;
    const next = upsertFile(project, path, "", "text");
    persist({ ...next, activeFilePath: path });
    if (!isPlayground && user?.id) {
      try {
        await fetch("/api/files", { 
          method: "POST", 
          headers: { 
            "Content-Type": "application/json",
            ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
          }, 
          body: JSON.stringify({ 
            action: "create", 
            path, 
            content: "", 
            projectId: project.id,
            userId: user.id,
          }) 
        });
      } catch {}
    }
  }

  async function handleCreateFolder(path: string) {
    if (!project) return;
    persist(createFolder(project, path));
    if (!isPlayground && user?.id) {
      try {
        await fetch("/api/files", { 
          method: "POST", 
          headers: { 
            "Content-Type": "application/json",
            ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
          }, 
          body: JSON.stringify({ 
            action: "create", 
            path, 
            isFolder: true, 
            projectId: project.id,
            userId: user.id,
          }) 
        });
      } catch {}
    }
  }

  async function handleRename(oldPath: string, newPath: string, isFolder: boolean) {
    if (!project) return;
    const next = isFolder ? renameFolder(project, oldPath, newPath) : renameFile(project, oldPath, newPath);
    persist(next);
    if (!isPlayground && user?.id) {
      try {
        await fetch("/api/files", { 
          method: "POST", 
          headers: { 
            "Content-Type": "application/json",
            ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
          }, 
          body: JSON.stringify({ 
            action: "rename", 
            path: oldPath, 
            newPath, 
            isFolder, 
            projectId: project.id,
            userId: user.id,
          }) 
        });
      } catch {}
    }
  }

  async function handleChangeCode(code: string) {
    if (!project || !project.activeFilePath) return;
    const existing = project.files?.find((f) => f.path === project.activeFilePath);
    const next = markDirty(
      upsertFile(project, project.activeFilePath, code, existing?.encoding ?? "text", existing?.mimeType),
      project.activeFilePath,
    );
    persist(next);
    if (!isPlayground && user?.id) {
      try {
        await fetch("/api/files", { 
          method: "POST", 
          headers: { 
            "Content-Type": "application/json",
            ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
          }, 
          body: JSON.stringify({ 
            action: "update", 
            path: project.activeFilePath, 
            content: code, 
            projectId: project.id,
            userId: user.id,
          }) 
        });
      } catch {}
    }
  }

  function handleSave() {
    if (!project || !project.activeFilePath || !project.files) return;
    const activeFile = project.files.find(f => f.path === project.activeFilePath);
    if (!activeFile) return;
    const next = saveFile(project, project.activeFilePath, activeFile.content);
    persist(next);
  }

  async function handleCodeAction(action: any) {
    if (!project) return;
    
    console.log("Executing code action:", action);
    
    switch (action.type) {
      case "create":
        if (action.content) {
          console.log("Creating file:", action.path, "with content:", action.content.substring(0, 100) + "...");
          const next = upsertFile(project, action.path, action.content, "text");
          persist({ ...next, activeFilePath: action.path });
          if (!isPlayground && user?.id) {
            try {
              await fetch("/api/files", { 
                method: "POST", 
                headers: { 
                  "Content-Type": "application/json",
                  ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
                }, 
                body: JSON.stringify({ 
                  action: "create", 
                  path: action.path, 
                  content: action.content, 
                  projectId: project.id,
                  userId: user.id,
                }) 
              });
            } catch {}
          }
        } else {
          console.log("No content provided for create action");
        }
        break;
      case "update":
        if (action.content) {
          console.log("Updating file:", action.path, "with content:", action.content.substring(0, 100) + "...");
          const existing = project.files?.find((f) => f.path === action.path);
          const next = upsertFile(project, action.path, action.content, existing?.encoding ?? "text", existing?.mimeType);
          persist(next);
          if (!isPlayground && user?.id) {
            try {
              await fetch("/api/files", { 
                method: "POST", 
                headers: { 
                  "Content-Type": "application/json",
                  ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
                }, 
                body: JSON.stringify({ 
                  action: "update", 
                  path: action.path, 
                  content: action.content, 
                  projectId: project.id,
                  userId: user.id,
                }) 
              });
            } catch {}
          }
        } else {
          console.log("No content provided for update action");
        }
        break;
      case "delete":
        console.log("Deleting file:", action.path);
        const next = deleteProjectFile(project, action.path);
        persist(next);
        if (!isPlayground && user?.id) {
          try {
            await fetch("/api/files", { 
              method: "POST", 
              headers: { 
                "Content-Type": "application/json",
                ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
              }, 
              body: JSON.stringify({ 
                action: "delete", 
                path: action.path, 
                projectId: project.id,
                userId: user.id,
              }) 
            });
          } catch {}
        }
        break;
    }
  }

  const handleFilesUploaded = useCallback(
    (files: Array<{ path: string; content: string; isFolder: boolean; encoding?: "text" | "base64"; mimeType?: string }>) => {
    if (!project) return;
    
    // Add folders first
    const folders = files.filter(f => f.isFolder);
    let updated = project;
    folders.forEach(f => {
      updated = createFolder(updated, f.path);
    });
    
    // Then add files
    files
      .filter(f => !f.isFolder)
      .forEach(f => {
        updated = upsertFile(updated, f.path, f.content, f.encoding, f.mimeType);
      });
    
    persist(updated);
  }, [project]);

  if (authLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col">
      <TopBar
        projectName={project?.name || "VibeCoder"}
        onCreateProject={handleCreateProject}
        onOpenProject={handleOpenProject}
        onRenameProject={handleRenameProject}
        user={user}
        isPlayground={isPlayground}
        onLoginClick={() => setLoginDialogOpen(true)}
        onLogout={logout}
        onTogglePlayground={(enabled) => {
          setPlaygroundMode(enabled);
          if (!enabled) {
            pruneExpiredPlaygroundProjects();
          }
        }}
      />
      <LoginDialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen} />
      <div className="flex flex-1 min-h-0">
        <div
          className="relative border-r flex flex-col"
          style={{ width: sidebarWidth, minWidth: sidebarMinWidth, maxWidth: sidebarMaxWidth }}
        >
          <ProjectSidebar
            projectName={project?.name || "Project"}
            files={project?.files || []}
            activePath={project?.activeFilePath}
            onSelectFile={handleSelectFile}
            onDeleteFile={handleDeleteFile}
            onCreateFile={handleCreateFile}
            onCreateFolder={handleCreateFolder}
            onRename={handleRename}
          />
          <div className="border-t p-4">
            <FileUpload onFilesUploaded={handleFilesUploaded} projectId={project?.id} />
          </div>
          <div
            className="absolute top-0 right-0 h-full w-1 cursor-col-resize bg-transparent hover:bg-primary/40 transition-colors"
            onPointerDown={handleSidebarResizeStart}
          />
        </div>
        <div className="flex-1 grid grid-cols-[1fr_360px] min-h-0">
          <div className="border-r min-h-0">
            <TabsBar
              paths={openTabs}
              activePath={project?.activeFilePath}
              dirtyFiles={project?.dirtyFiles || []}
              onSelect={(p) => project && persist(setActiveFile(project, p))}
              onClose={(p) => {
                if (!project) return;
                const { closeOpenFile } = require("@/lib/projects");
                persist(closeOpenFile(project, p));
              }}
            />
            <CodeEditor
              path={activeFile?.path}
              value={activeFile?.content ?? ""}
              encoding={activeFile?.encoding}
              mimeType={activeFile?.mimeType}
              onChange={handleChangeCode}
              onSave={handleSave}
            />
          </div>
          <div className="min-h-0 p-4">
            <CallPanel
              isActive={isCalling}
              onStart={() => setIsCalling(true)}
              onEnd={() => setIsCalling(false)}
              onCodeAction={handleCodeAction}
              currentFile={activeFile?.path}
              projectFiles={project?.files}
              selectedCode={activeFile?.content}
              projectId={project?.id}
              userId={user?.id}
              isPlaygroundProject={project?.isPlayground}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
