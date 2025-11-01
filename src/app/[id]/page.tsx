"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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

  useEffect(() => {
    const existing = readProjectsFromStorage();
    if (existing.length === 0) {
      const created = createDefaultProject("Welcome Project");
      writeProjectsToStorage([created]);
      setProjects([created]);
      setProject(created);
      router.replace(`/${created.id}`);
      return;
    }
    setProjects(existing);
    const target = findProject(existing, projectId) || existing[0];
    setProject(target);
    if (!projectId || target.id !== projectId) {
      router.replace(`/${target.id}`);
    }
  }, [projectId, router]);

  const activeFile = useMemo(() => {
    if (!project || !project.activeFilePath) return undefined;
    return project.files.find(f => f.path === project.activeFilePath);
  }, [project]);
  const openTabs = project?.openFilePaths || (project?.activeFilePath ? [project.activeFilePath] : []);

  function persist(next: Project) {
    setProject(next);
    const updated = upsertProject(projects, next);
    setProjects(updated);
    writeProjectsToStorage(updated);
  }

  function handleCreateProject() {
    const p = createDefaultProject("New Project");
    const updated = [p, ...projects];
    setProjects(updated);
    writeProjectsToStorage(updated);
    setProject(p);
    router.push(`/${p.id}`);
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

  function handleDeleteFile(path: string) {
    if (!project) return;
    const next = deleteProjectFile(project, path);
    persist(next);
  }

  function handleCreateFile(path: string) {
    if (!project) return;
    const next = upsertFile(project, path, "");
    persist({ ...next, activeFilePath: path });
  }

  function handleCreateFolder(path: string) {
    if (!project) return;
    persist(createFolder(project, path));
  }

  function handleRename(oldPath: string, newPath: string, isFolder: boolean) {
    if (!project) return;
    const next = isFolder ? renameFolder(project, oldPath, newPath) : renameFile(project, oldPath, newPath);
    persist(next);
  }

  function handleChangeCode(code: string) {
    if (!project || !project.activeFilePath) return;
    const next = markDirty(upsertFile(project, project.activeFilePath, code), project.activeFilePath);
    persist(next);
  }

  function handleSave() {
    if (!project || !project.activeFilePath) return;
    const activeFile = project.files.find(f => f.path === project.activeFilePath);
    if (!activeFile) return;
    const next = saveFile(project, project.activeFilePath, activeFile.content);
    persist(next);
  }

  function handleCodeAction(action: any) {
    if (!project) return;
    
    switch (action.type) {
      case "create":
        if (action.content) {
          const next = upsertFile(project, action.path, action.content);
          persist({ ...next, activeFilePath: action.path });
        }
        break;
      case "update":
        if (action.content) {
          const next = upsertFile(project, action.path, action.content);
          persist(next);
        }
        break;
      case "delete":
        const next = deleteProjectFile(project, action.path);
        persist(next);
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
            />
          </div>
        </div>
      </div>
    </div>
  );
}


