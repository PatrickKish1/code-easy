"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type TabsBarProps = {
  paths: string[];
  activePath?: string;
  dirtyFiles?: string[];
  onSelect: (path: string) => void;
  onClose: (path: string) => void;
};

export function TabsBar({ paths, activePath, dirtyFiles = [], onSelect, onClose }: TabsBarProps) {
  return (
    <div className="flex items-center gap-1 border-b px-2 py-1 overflow-x-auto">
      {paths.map(path => {
        const isDirty = dirtyFiles.includes(path);
        return (
          <div key={path} className={cn("flex items-center gap-2 px-2 py-1 rounded cursor-pointer whitespace-nowrap",
            activePath === path ? "bg-accent" : "hover:bg-accent")}
            onClick={() => onSelect(path)}
          >
            <span className="text-sm truncate max-w-[200px]">{path}</span>
            {isDirty && <div className="w-2 h-2 rounded-full bg-foreground" />}
            <Button size="lg" variant="ghost" onClick={(e) => { e.stopPropagation(); onClose(path); }}>×</Button>
          </div>
        );
      })}
    </div>
  );
}


