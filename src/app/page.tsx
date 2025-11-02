"use client";

import { useEffect, useMemo, useState } from "react";
import { TopBar, ProjectSidebar, CodeEditor, TabsBar } from "@/components/ide";
import { CallPanel } from "@/components/CallPanel";
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
} from "@/lib/projects";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [isCalling, setIsCalling] = useState(false);

  useEffect(() => {
    loadProjectsFromAppwrite();
  }, []);

  async function loadProjectsFromAppwrite() {
    try {
      const response = await fetch("/api/projects");
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

  async function persist(next: Project) {
    setProject(next);
    const updated = upsertProject(projects, next);
    setProjects(updated);
    writeProjectsToStorage(updated);
    
    // Sync to Appwrite
    try {
      await fetch("/api/projects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...next })
      });
    } catch (error) {
      console.error("Failed to sync project to Appwrite:", error);
    }
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
        writeProjectsToStorage(updated);
        setProject(projectWithFiles);
        router.push(`/${data.project.id}`);
      }
    } catch (error) {
      console.error("Failed to create project:", error);
      // Fallback to local storage
      const p = createDefaultProject("New Project");
      const updated = [p, ...projects];
      setProjects(updated);
      writeProjectsToStorage(updated);
      setProject(p);
      router.push(`/${p.id}`);
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
    try {
      await fetch("/api/files", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ action: "delete", path, projectId: project.id }) 
      });
    } catch {}
  }

  async function handleCreateFile(path: string) {
    if (!project) return;
    const next = upsertFile(project, path, "");
    persist({ ...next, activeFilePath: path });
    try {
      await fetch("/api/files", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ action: "create", path, content: "", projectId: project.id }) 
      });
    } catch {}
  }

  async function handleCreateFolder(path: string) {
    if (!project) return;
    persist(createFolder(project, path));
    try {
      await fetch("/api/files", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ action: "create", path, isFolder: true, projectId: project.id }) 
      });
    } catch {}
  }

  async function handleRename(oldPath: string, newPath: string, isFolder: boolean) {
    if (!project) return;
    const next = isFolder ? renameFolder(project, oldPath, newPath) : renameFile(project, oldPath, newPath);
    persist(next);
    try {
      await fetch("/api/files", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ action: "rename", path: oldPath, newPath, isFolder, projectId: project.id }) 
      });
    } catch {}
  }

  async function handleChangeCode(code: string) {
    if (!project || !project.activeFilePath) return;
    const next = markDirty(upsertFile(project, project.activeFilePath, code), project.activeFilePath);
    persist(next);
    try {
      await fetch("/api/files", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ action: "update", path: project.activeFilePath, content: code, projectId: project.id }) 
      });
    } catch {}
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
          const next = upsertFile(project, action.path, action.content);
          persist({ ...next, activeFilePath: action.path });
          try {
            await fetch("/api/files", { 
              method: "POST", 
              headers: { "Content-Type": "application/json" }, 
              body: JSON.stringify({ action: "create", path: action.path, content: action.content, projectId: project.id }) 
            });
          } catch {}
        } else {
          console.log("No content provided for create action");
        }
        break;
      case "update":
        if (action.content) {
          console.log("Updating file:", action.path, "with content:", action.content.substring(0, 100) + "...");
          const next = upsertFile(project, action.path, action.content);
          persist(next);
          try {
            await fetch("/api/files", { 
              method: "POST", 
              headers: { "Content-Type": "application/json" }, 
              body: JSON.stringify({ action: "update", path: action.path, content: action.content, projectId: project.id }) 
            });
          } catch {}
        } else {
          console.log("No content provided for update action");
        }
        break;
      case "delete":
        console.log("Deleting file:", action.path);
        const next = deleteProjectFile(project, action.path);
        persist(next);
        try {
          await fetch("/api/files", { 
            method: "POST", 
            headers: { "Content-Type": "application/json" }, 
            body: JSON.stringify({ action: "delete", path: action.path, projectId: project.id }) 
          });
        } catch {}
        break;
    }
  }

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
            />
          </div>
        </div>
      </div>
    </div>
  );
}
