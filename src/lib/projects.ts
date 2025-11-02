export type ProjectFile = {
  path: string; // e.g., "src/index.ts"
  content: string;
};

export type Project = {
  id: string;
  name: string;
  files: ProjectFile[];
  activeFilePath?: string;
  openFilePaths?: string[];
  dirtyFiles?: string[];
  updatedAt: number;
  createdAt: number;
};

const STORAGE_KEY = "vibecoder.projects";

export function generateUuid(): string {
  // Simple RFC4122 v4-ish UUID generator suitable for client-side
  // Not cryptographically strong; fine for local usage
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function readProjectsFromStorage(): Project[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Project[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeProjectsToStorage(projects: Project[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function findProject(projects: Project[], id: string | undefined): Project | undefined {
  if (!id) return undefined;
  return projects.find(p => p.id === id);
}

export function createDefaultProject(name?: string): Project {
  const now = Date.now();
  const projectId = generateUuid();
  const files: ProjectFile[] = [
    {
      path: "README.md",
      content: `# ${name || "New Project"}\n\nWelcome to your project!\n`,
    },
    {
      path: "src/index.ts",
      content: "export const hello = () => 'Hello, VibeCoder!';\n",
    },
  ];
  return {
    id: projectId,
    name: name || "Untitled Project",
    files,
    activeFilePath: files[0].path,
    openFilePaths: [files[0].path],
    dirtyFiles: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function upsertProject(projects: Project[], project: Project): Project[] {
  const index = projects.findIndex(p => p.id === project.id);
  if (index === -1) return [project, ...projects];
  const next = [...projects];
  next[index] = project;
  return next;
}

export function deleteProject(projects: Project[], id: string): Project[] {
  return projects.filter(p => p.id !== id);
}

export function upsertFile(project: Project, path: string, content: string): Project {
  // Ensure files array exists
  const existingFiles = project.files || [];
  const idx = existingFiles.findIndex(f => f.path === path);
  const files = [...existingFiles];
  if (idx === -1) {
    files.push({ path, content });
  } else {
    files[idx] = { path, content };
  }
  return { ...project, files, updatedAt: Date.now() };
}

export function deleteFile(project: Project, path: string): Project {
  const existingFiles = project.files || [];
  const files = existingFiles.filter(f => f.path !== path);
  let activeFilePath = project.activeFilePath;
  if (activeFilePath === path) {
    // pick next open tab if available, else first file
    const remainingTabs = (project.openFilePaths || []).filter(p => p !== path);
    activeFilePath = remainingTabs[remainingTabs.length - 1] || files[0]?.path;
  }
  const openFilePaths = (project.openFilePaths || []).filter(p => p !== path);
  return { ...project, files, activeFilePath, openFilePaths, updatedAt: Date.now() };
}

export function setActiveFile(project: Project, path: string | undefined): Project {
  let openFilePaths = project.openFilePaths || [];
  if (path && !openFilePaths.includes(path)) openFilePaths = [...openFilePaths, path];
  return { ...project, activeFilePath: path, openFilePaths, updatedAt: Date.now() };
}

export function ensureOpenFile(project: Project, path: string): Project {
  const openFilePaths = project.openFilePaths || [];
  if (openFilePaths.includes(path)) return { ...project, activeFilePath: path, updatedAt: Date.now() };
  return { ...project, activeFilePath: path, openFilePaths: [...openFilePaths, path], updatedAt: Date.now() };
}

export function closeOpenFile(project: Project, path: string): Project {
  const open = (project.openFilePaths || []).filter(p => p !== path);
  let active = project.activeFilePath;
  if (active === path) {
    const existingFiles = project.files || [];
    active = open[open.length - 1] || existingFiles[0]?.path;
  }
  const dirtyFiles = (project.dirtyFiles || []).filter(p => p !== path);
  return { ...project, openFilePaths: open, activeFilePath: active, dirtyFiles, updatedAt: Date.now() };
}

export function renameFile(project: Project, oldPath: string, newPath: string): Project {
  if (oldPath === newPath) return project;
  const existingFiles = project.files || [];
  const files = existingFiles.map(f => f.path === oldPath ? { path: newPath, content: f.content } : f);
  const openFilePaths = (project.openFilePaths || []).map(p => p === oldPath ? newPath : p);
  const activeFilePath = project.activeFilePath === oldPath ? newPath : project.activeFilePath;
  return { ...project, files, openFilePaths, activeFilePath, updatedAt: Date.now() };
}

export function createFolder(project: Project, folderPath: string): Project {
  const normalized = folderPath.replace(/\\/g, "/").replace(/\/$/, "");
  const placeholder = `${normalized}/.keep`;
  const existingFiles = project.files || [];
  if (existingFiles.some(f => f.path === placeholder)) return project;
  const files = [...existingFiles, { path: placeholder, content: "" }];
  return { ...project, files, updatedAt: Date.now() };
}

export function renameFolder(project: Project, oldPrefix: string, newPrefix: string): Project {
  const from = oldPrefix.replace(/\\/g, "/").replace(/\/$/, "");
  const to = newPrefix.replace(/\\/g, "/").replace(/\/$/, "");
  if (from === to) return project;
  const existingFiles = project.files || [];
  const files = existingFiles.map(f => f.path.startsWith(from + "/") ? { path: f.path.replace(from + "/", to + "/"), content: f.content } : f);
  const openFilePaths = (project.openFilePaths || []).map(p => p.startsWith(from + "/") ? p.replace(from + "/", to + "/") : p);
  const activeFilePath = project.activeFilePath && project.activeFilePath.startsWith(from + "/") ? project.activeFilePath.replace(from + "/", to + "/") : project.activeFilePath;
  const dirtyFiles = (project.dirtyFiles || []).map(p => p.startsWith(from + "/") ? p.replace(from + "/", to + "/") : p);
  return { ...project, files, openFilePaths, activeFilePath, dirtyFiles, updatedAt: Date.now() };
}

export function markDirty(project: Project, path: string): Project {
  const dirtyFiles = project.dirtyFiles || [];
  if (dirtyFiles.includes(path)) return project;
  return { ...project, dirtyFiles: [...dirtyFiles, path], updatedAt: Date.now() };
}

export function markClean(project: Project, path: string): Project {
  const dirtyFiles = (project.dirtyFiles || []).filter(p => p !== path);
  return { ...project, dirtyFiles, updatedAt: Date.now() };
}

export function saveFile(project: Project, path: string, content: string): Project {
  const next = upsertFile(project, path, content);
  return markClean(next, path);
}


