"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import BuilderOrb from "@/components/BuilderOrb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Rocket, Code, Play, Square, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { CallPanel } from "@/components/CallPanel";

export default function BuilderBuildPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading, sessionToken } = useAuth();
  const projectId = params?.id as string;

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewRunning, setPreviewRunning] = useState(false);
  const [files, setFiles] = useState<any[]>([]);
  const [currentFile, setCurrentFile] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/builder");
      return;
    }

    if (user && projectId) {
      loadProject();
    }
  }, [user, projectId, authLoading]);

  const loadProject = async () => {
    if (!sessionToken || !projectId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/builder/projects?projectId=${projectId}`, {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load project");
      }

      const data = await response.json();
      setProject(data.project);
      
      if (data.project.previewUrl) {
        setPreviewUrl(data.project.previewUrl);
        setPreviewRunning(true);
      }

      // Load files
      await loadFiles();
    } catch (error) {
      console.error("Failed to load project:", error);
      toast.error("Failed to load project");
    } finally {
      setLoading(false);
    }
  };

  const loadFiles = async () => {
    if (!projectId) return;

    try {
      const response = await fetch(`/api/files?projectId=${projectId}`);
      const data = await response.json();
      if (data.files) {
        setFiles(data.files.filter((f: any) => !f.isFolder));
      }
    } catch (error) {
      console.error("Failed to load files:", error);
    }
  };

  const handleStartPreview = async () => {
    if (!sessionToken || !projectId) return;

    try {
      toast.info("Starting preview server...");
      
      const response = await fetch("/api/builder/preview/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ projectId }),
      });

      if (!response.ok) {
        throw new Error("Failed to start preview");
      }

      const data = await response.json();
      setPreviewUrl(data.previewUrl);
      setPreviewRunning(true);
      toast.success("Preview server started!");
    } catch (error) {
      console.error("Failed to start preview:", error);
      toast.error("Failed to start preview server");
    }
  };

  const handleCodeAction = async (action: { type: string; path: string; content?: string }) => {
    if (!sessionToken || !projectId) return;

    try {
      const response = await fetch("/api/files", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          projectId,
          action: action.type,
          path: action.path,
          content: action.content,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update file");
      }

      await loadFiles();
      toast.success(`File ${action.type === "create" ? "created" : action.type === "update" ? "updated" : "deleted"} successfully`);
    } catch (error) {
      console.error("Failed to handle code action:", error);
      toast.error("Failed to update file");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="text-muted-foreground">Loading project...</div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-muted-foreground">Project not found</div>
          <Button onClick={() => router.push("/builder")}>Back to Builder</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b px-6 py-4 flex items-center justify-between bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/builder")}>
            ← Back
          </Button>
          <div>
            <h1 className="text-xl font-bold">{project.name}</h1>
            <p className="text-sm text-muted-foreground">
              {project.framework} • {project.status}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {previewRunning && previewUrl ? (
            <Button variant="outline" size="sm" onClick={() => window.open(previewUrl, "_blank")}>
              <Play className="h-4 w-4 mr-2" />
              Open Preview
            </Button>
          ) : (
            <Button size="sm" onClick={handleStartPreview}>
              <Play className="h-4 w-4 mr-2" />
              Start Preview
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={loadProject}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-[1fr_400px] min-h-0">
        {/* Preview Area */}
        <div className="border-r flex flex-col">
          <div className="border-b px-4 py-2 bg-muted/50">
            <h2 className="text-sm font-medium">Preview</h2>
          </div>
          <div className="flex-1 relative bg-muted">
            {previewRunning && previewUrl ? (
              <iframe
                src={previewUrl}
                className="w-full h-full border-0"
                title="App Preview"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-4">
                  <Code className="h-12 w-12 mx-auto text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground mb-2">No preview available</p>
                    <Button onClick={handleStartPreview}>
                      <Play className="h-4 w-4 mr-2" />
                      Start Preview Server
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI Assistant Panel */}
        <div className="flex flex-col min-h-0">
          <div className="border-b px-4 py-2 bg-muted/50">
            <h2 className="text-sm font-medium">AI Assistant</h2>
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">
            <CallPanel
              onStart={() => {}}
              onEnd={() => {}}
              isActive={false}
              onCodeAction={handleCodeAction}
              currentFile={currentFile || undefined}
              projectFiles={files.map(f => ({ path: f.path, content: f.content || "" }))}
              selectedCode={undefined}
              projectId={projectId}
              userId={user?.id || undefined}
              isPlaygroundProject={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

