"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { TopBar, ProjectSidebar, CodeEditor, TabsBar } from "@/components/ide";
import { CallPanel } from "@/components/CallPanel";
import {
  Project,
  deleteFile as deleteProjectFile,
  setActiveFile,
  upsertFile,
  findProject,
  createFolder,
  renameFile,
  renameFolder,
  markDirty,
  saveFile,
} from "@/lib/projects";

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string | undefined);

  const [projects, setProjects] = useState<Project[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [isCalling, setIsCalling] = useState(false);

  // Load projects from Appwrite
  useEffect(() => {
    loadProjectsFromAppwrite();
  }, []);

  // Load specific project when projectId changes
  useEffect(() => {
    if (projects.length > 0 && projectId) {
      const target = findProject(projects, projectId);
      if (target) {
        loadProjectFiles(target.id).then(files => {
          const projectWithFiles = { ...target, files };
          setProject(projectWithFiles);
        });
      } else if (projectId !== project?.id) {
        // If project not found, redirect to first project
        router.replace(`/${projects[0].id}`);
      }
    }
  }, [projectId, projects]);

  // Realtime sync with Appwrite changes
  useEffect(() => {
    if (!project) return;
    const currentProjectId = project.id;
    
    const es = new EventSource('/api/realtime');
    const onCreated = (e: MessageEvent) => {
      try {
        const data = JSON.parse((e as any).data);
        if (data.projectId !== currentProjectId) return;
        setProject((prev) => {
          if (!prev || prev.id !== currentProjectId) return prev;
          return upsertFile(prev, data.path, data.content ?? "");
        });
      } catch {}
    };
    const onUpdated = (e: MessageEvent) => {
      try {
        const data = JSON.parse((e as any).data);
        if (data.projectId !== currentProjectId) return;
        setProject((prev) => {
          if (!prev || prev.id !== currentProjectId) return prev;
          return upsertFile(prev, data.path, data.content ?? "");
        });
      } catch {}
    };
    const onRenamed = (e: MessageEvent) => {
      try {
        const data = JSON.parse((e as any).data);
        if (data.projectId !== currentProjectId) return;
        setProject((prev) => {
          if (!prev || prev.id !== currentProjectId) return prev;
          return renameFile(prev, data.oldPath, data.newPath);
        });
      } catch {}
    };
    const onDeleted = (e: MessageEvent) => {
      try {
        const data = JSON.parse((e as any).data);
        if (data.projectId !== currentProjectId) return;
        setProject((prev) => {
          if (!prev || prev.id !== currentProjectId) return prev;
          return deleteProjectFile(prev, data.path);
        });
      } catch {}
    };
    es.addEventListener('file:created', onCreated as any);
    es.addEventListener('file:updated', onUpdated as any);
    es.addEventListener('file:renamed', onRenamed as any);
    es.addEventListener('file:deleted', onDeleted as any);
    return () => {
      try { es.close(); } catch {}
    };
  }, [project?.id]);

  async function loadProjectsFromAppwrite() {
    try {
      const response = await fetch("/api/projects");
      const data = await response.json();
      if (data.projects && data.projects.length > 0) {
        const normalized = data.projects.map((p: Project) => ({
          ...p,
          files: [], // Will be loaded separately
          openFilePaths: p.openFilePaths || [],
          dirtyFiles: p.dirtyFiles || [],
        }));
        setProjects(normalized);
        
        // Load files for the target project
        const targetId = projectId || normalized[0].id;
        const target = findProject(normalized, targetId) || normalized[0];
        const files = await loadProjectFiles(target.id);
        const projectWithFiles = { ...target, files };
        setProject(projectWithFiles);
        
        if (!projectId || target.id !== projectId) {
          router.replace(`/${target.id}`);
        }
      } else {
        // Create default project if none exist
        const response = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Welcome Project" })
        });
        const data = await response.json();
        if (data.project) {
          const projectWithFiles = { ...data.project, files: [] };
          setProjects([projectWithFiles]);
          setProject(projectWithFiles);
          router.replace(`/${data.project.id}`);
        }
      }
    } catch (error) {
      console.error("Failed to load projects from Appwrite:", error);
    }
  }

  async function loadProjectFiles(projectId: string): Promise<Project['files']> {
    try {
      const response = await fetch(`/api/files?projectId=${projectId}`);
      const data = await response.json();
      if (data.files) {
        // Filter out folders (they have isFolder: true)
        return data.files
          .filter((f: any) => !f.isFolder)
          .map((f: any) => ({
            path: f.path,
            content: f.content || "",
          }));
      }
      return [];
    } catch (error) {
      console.error("Failed to load files from Appwrite:", error);
      return [];
    }
  }

  const activeFile = useMemo(() => {
    if (!project || !project.activeFilePath || !project.files) return undefined;
    return project.files.find(f => f.path === project.activeFilePath);
  }, [project]);
  const openTabs = project?.openFilePaths || (project?.activeFilePath ? [project.activeFilePath] : []);

  async function persist(next: Project) {
    setProject(next);
    // Update projects list
    const updated = projects.map(p => p.id === next.id ? next : p);
    setProjects(updated);
    
    // Sync to Appwrite - update project metadata (don't include files or timestamps)
    // Fire and forget - don't block UI updates if sync fails
    fetch("/api/projects", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: next.id,
        name: next.name,
        activeFilePath: next.activeFilePath || null,
        openFilePaths: next.openFilePaths || [],
        dirtyFiles: next.dirtyFiles || [],
      })
    })
    .then(async (response) => {
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        console.error("Failed to sync project to Appwrite:", response.status, errorData);
      }
    })
    .catch(error => {
      console.error("Failed to sync project to Appwrite (network error):", error);
      // Don't throw - allow UI to continue working even if sync fails
    });
  }

  async function handleCreateProject() {
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "New Project" })
      });
      const data = await response.json();
      if (data.project) {
        const projectWithFiles = { ...data.project, files: [] };
        const updated = [projectWithFiles, ...projects];
        setProjects(updated);
        setProject(projectWithFiles);
        router.push(`/${data.project.id}`);
      }
    } catch (error) {
      console.error("Failed to create project:", error);
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
    // Sync to Appwrite
    try {
      await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", path, projectId: project.id })
      });
    } catch (error) {
      console.error("Failed to delete file from Appwrite:", error);
    }
  }

  async function handleCreateFile(path: string) {
    if (!project) return;
    const next = upsertFile(project, path, "");
    persist({ ...next, activeFilePath: path });
    // Sync to Appwrite
    try {
      await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", path, content: "", projectId: project.id })
      });
    } catch (error) {
      console.error("Failed to create file in Appwrite:", error);
    }
  }

  async function handleCreateFolder(path: string) {
    if (!project) return;
    const next = createFolder(project, path);
    persist(next);
    // Sync to Appwrite - create .keep file for folder
    const folderPath = path.replace(/\\/g, "/").replace(/\/$/, "");
    const placeholder = `${folderPath}/.keep`;
    try {
      await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", path: placeholder, isFolder: true, projectId: project.id })
      });
    } catch (error) {
      console.error("Failed to create folder in Appwrite:", error);
    }
  }

  async function handleRename(oldPath: string, newPath: string, isFolder: boolean) {
    if (!project) return;
    const next = isFolder ? renameFolder(project, oldPath, newPath) : renameFile(project, oldPath, newPath);
    persist(next);
    // Sync to Appwrite
    try {
      await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rename", path: oldPath, newPath, isFolder, projectId: project.id })
      });
    } catch (error) {
      console.error("Failed to rename file in Appwrite:", error);
    }
  }

  function handleChangeCode(code: string) {
    if (!project || !project.activeFilePath) return;
    const next = markDirty(upsertFile(project, project.activeFilePath, code), project.activeFilePath);
    persist(next);
  }

  async function handleSave() {
    if (!project || !project.activeFilePath) return;
    const activeFile = project.files.find(f => f.path === project.activeFilePath);
    if (!activeFile) return;
    const next = saveFile(project, project.activeFilePath, activeFile.content);
    persist(next);
    // Sync to Appwrite
    try {
      await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", path: project.activeFilePath, content: activeFile.content, projectId: project.id })
      });
    } catch (error) {
      console.error("Failed to save file to Appwrite:", error);
    }
  }

  async function handleCodeAction(action: any) {
    if (!project) return;
    
    console.log("Executing code action:", action);
    
    switch (action.type) {
      case "create":
        if (action.content) {
          console.log("Creating file:", action.path, "with content:", action.content.substring(0, 100) + "...");
          const next = upsertFile(project, action.path, action.content);
          persist({ ...next, activeFilePath: action.path });
          // Persist to Appwrite
          try {
            await fetch("/api/files", { 
              method: "POST", 
              headers: { "Content-Type": "application/json" }, 
              body: JSON.stringify({ action: "create", path: action.path, content: action.content, projectId: project.id }) 
            });
          } catch (error) {
            console.error("Failed to persist file to Appwrite:", error);
          }
        } else {
          console.log("No content provided for create action");
        }
        break;
      case "update":
        if (action.content) {
          console.log("Updating file:", action.path, "with content:", action.content.substring(0, 100) + "...");
          const next = upsertFile(project, action.path, action.content);
          persist(next);
          // Persist to Appwrite
          try {
            await fetch("/api/files", { 
              method: "POST", 
              headers: { "Content-Type": "application/json" }, 
              body: JSON.stringify({ action: "update", path: action.path, content: action.content, projectId: project.id }) 
            });
          } catch (error) {
            console.error("Failed to persist file to Appwrite:", error);
          }
        } else {
          console.log("No content provided for update action");
        }
        break;
      case "delete":
        console.log("Deleting file:", action.path);
        const next = deleteProjectFile(project, action.path);
        persist(next);
        // Persist to Appwrite
        try {
          await fetch("/api/files", { 
            method: "POST", 
            headers: { "Content-Type": "application/json" }, 
            body: JSON.stringify({ action: "delete", path: action.path, projectId: project.id }) 
          });
        } catch (error) {
          console.error("Failed to delete file from Appwrite:", error);
        }
        break;
    }
  }

  if (!project) return null;

  return (
    <div className="h-screen w-screen flex flex-col">
      <TopBar
        projectName={project?.name || "VibeCoder"}
        onCreateProject={handleCreateProject}
        onOpenProject={handleOpenProject}
        onRenameProject={handleRenameProject}
      />
      <div className="flex flex-1 min-h-0">
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
              onChange={handleChangeCode}
              onSave={handleSave}
            />
          </div>
          <div className="min-h-0 p-2">
            <CallPanel
              isActive={isCalling}
              onStart={() => setIsCalling(true)}
              onEnd={() => setIsCalling(false)}
              onCodeAction={handleCodeAction}
              currentFile={activeFile?.path}
              projectFiles={project?.files}
              selectedCode={activeFile?.content}
              projectId={project.id}
            />
          </div>
        </div>
      </div>
    </div>
  );
}


