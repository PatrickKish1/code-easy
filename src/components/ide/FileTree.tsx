"use client";

import { ProjectFile } from "@/lib/projects";
import { cn } from "@/lib/utils";

type FileTreeProps = {
  files: ProjectFile[];
  activePath?: string;
  onSelect: (path: string) => void;
  onDelete: (path: string) => void;
  onRename?: (path: string, isFolder: boolean) => void;
};

function groupByDirectory(paths: string[]): Record<string, string[]> {
  const tree: Record<string, string[]> = {};
  for (const p of paths) {
    const parts = p.split("/");
    const fileName = parts.pop() as string;
    const dir = parts.join("/");
    const key = dir || "/";
    if (!tree[key]) tree[key] = [];
    tree[key].push(fileName);
  }
  return tree;
}

export function FileTree({ files, activePath, onSelect, onDelete, onRename }: FileTreeProps) {
  const paths = files.map(f => f.path);
  const grouped = groupByDirectory(paths);

  return (
    <div className="text-sm">
      {Object.keys(grouped).sort().map(dir => (
        <div key={dir} className="mb-2">
          <div className="px-2 py-1 text-xs uppercase text-muted-foreground">{dir === "/" ? "root" : dir}</div>
          <div className="flex flex-col">
            {grouped[dir].sort().map(name => {
              const path = dir === "/" || dir === "" ? name : `${dir}/${name}`;
              const isActive = path === activePath;
              const isFolder = name === ".keep";
              return (
                <div
                  key={path}
                  className={cn(
                    "flex items-center justify-between px-2 py-1 cursor-pointer rounded hover:bg-accent group",
                    isActive && "bg-accent"
                  )}
                  onClick={() => onSelect(path)}
                >
                  <span className="truncate">{isFolder ? dir : name}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                    {onRename && (
                      <button
                        className="text-muted-foreground hover:text-foreground text-xs"
                        onClick={(e) => { e.stopPropagation(); onRename(path, isFolder); }}
                        aria-label={`Rename ${name}`}
                      >
                        Rename
                      </button>
                    )}
                    <button
                      className="text-muted-foreground hover:text-foreground text-xs"
                      onClick={(e) => { e.stopPropagation(); onDelete(path); }}
                      aria-label={`Delete ${name}`}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}


