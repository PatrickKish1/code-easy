"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import * as React from "react";
import Link from "next/link";
import { readProjectsFromStorage } from "@/lib/projects";

type TopBarProps = {
  projectName: string;
  onCreateProject: () => void;
  onRenameProject: () => void;
  onOpenProject: () => void;
};

export function TopBar({ projectName, onCreateProject, onRenameProject, onOpenProject }: TopBarProps) {
  const router = useRouter();
  const [renameOpen, setRenameOpen] = React.useState(false);
  const [newOpen, setNewOpen] = React.useState(false);
  const [openOpen, setOpenOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [projects, setProjects] = React.useState(() => readProjectsFromStorage());
  const renameInput = React.useRef<HTMLInputElement | null>(null);
  const newInput = React.useRef<HTMLInputElement | null>(null);
  const filtered = React.useMemo(() => {
    const q = query.toLowerCase();
    return projects.filter(p => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q));
  }, [projects, query]);
  return (
    <div className="w-full flex items-center gap-2 px-3 py-2 border-b bg-background/50">
      <div className="font-medium truncate">{projectName}</div>
      <Separator orientation="vertical" className="mx-2 h-6" />
      <div className="flex items-center gap-2">
        <Dialog open={newOpen} onOpenChange={setNewOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="secondary">New Project</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Project</DialogTitle>
            </DialogHeader>
            <Input ref={newInput} placeholder="Project name" defaultValue="New Project" />
            <DialogFooter>
              <Button onClick={() => { onCreateProject(); setNewOpen(false); }}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={openOpen} onOpenChange={setOpenOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="secondary">Open…</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Open Project</DialogTitle>
            </DialogHeader>
            <Input placeholder="Search by name or id" value={query} onChange={(e) => setQuery(e.target.value)} />
            <div className="max-h-64 overflow-auto divide-y">
              {filtered.map(p => (
                <div key={p.id} className="flex items-center justify-between py-2">
                  <div className="min-w-0 mr-2">
                    <div className="font-medium truncate">{p.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{p.id}</div>
                  </div>
                  <Link href={`/${p.id}`} className="text-sm underline">Open</Link>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="py-6 text-sm text-muted-foreground text-center">No projects</div>
              )}
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setProjects(readProjectsFromStorage())}>Refresh</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="ghost">Rename</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rename Project</DialogTitle>
            </DialogHeader>
            <Input ref={renameInput} placeholder="Project name" defaultValue={projectName} />
            <DialogFooter>
              <Button onClick={() => { onRenameProject(); setRenameOpen(false); }}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="ml-auto mr-6 flex items-center gap-2">
        <Link href="/tools">
          <Button size="sm" variant="ghost">Tools</Button>
        </Link>
        <ThemeToggle />
        <div className="text-xs text-muted-foreground">VibeCoder</div>
      </div>
    </div>
  );
}


