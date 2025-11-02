"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toolsConfig } from "@/lib/tools-config";
import { CheckCircle2, Loader2 } from "lucide-react";

interface ExistingTool {
  id: string;
  tool_config: {
    name: string;
    type: string;
    description: string;
  };
  access_info: {
    is_creator: boolean;
    creator_name: string;
    creator_email: string;
    role: string;
  };
  usage_stats: {
    total_calls: number;
    avg_latency_secs: number;
  };
}

export default function ToolsPage() {
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<Record<string, { success: boolean; message: string }>>({});
  const [expandedTool, setExpandedTool] = useState<string | null>(null);
  const [existingTools, setExistingTools] = useState<ExistingTool[]>([]);
  const [loadingTools, setLoadingTools] = useState(false);
  const [toolsError, setToolsError] = useState<string | null>(null);

  // Fetch existing tools when API key changes
  const fetchExistingTools = async () => {
    if (!apiKey.trim()) {
      setExistingTools([]);
      return;
    }

    setLoadingTools(true);
    setToolsError(null);

    try {
      const response = await fetch("/api/tools/list", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ apiKey }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setExistingTools(data.data?.tools || []);
      } else {
        setToolsError(data.error || "Failed to fetch tools");
        setExistingTools([]);
      }
    } catch (error) {
      setToolsError(`Failed to fetch tools: ${error instanceof Error ? error.message : String(error)}`);
      setExistingTools([]);
    } finally {
      setLoadingTools(false);
    }
  };

  // Check if a tool already exists by name
  const isToolExisting = useMemo(() => {
    const toolNameMap: Record<string, boolean> = {};
    existingTools.forEach((tool) => {
      toolNameMap[tool.tool_config.name] = true;
    });
    return toolNameMap;
  }, [existingTools]);

  const handleCreateTool = async (toolId: string, toolConfig: any) => {
    if (!apiKey.trim()) {
      setResults((prev) => ({
        ...prev,
        [toolId]: {
          success: false,
          message: "Please enter your ElevenLabs API key first",
        },
      }));
      return;
    }

    setLoading((prev) => ({ ...prev, [toolId]: true }));
    setResults((prev) => ({ ...prev, [toolId]: { success: false, message: "" } }));

    try {
      const response = await fetch("/api/tools/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          toolConfig,
          apiKey,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResults((prev) => ({
          ...prev,
          [toolId]: {
            success: true,
            message: `Tool created successfully! ID: ${data.data?.id || "N/A"}`,
          },
        }));
        // Refresh tools list after successful creation
        await fetchExistingTools();
      } else {
        setResults((prev) => ({
          ...prev,
          [toolId]: {
            success: false,
            message: `Error: ${data.error || "Unknown error"}. ${data.details ? JSON.stringify(data.details, null, 2) : ""}`,
          },
        }));
      }
    } catch (error) {
      setResults((prev) => ({
        ...prev,
        [toolId]: {
          success: false,
          message: `Failed to create tool: ${error instanceof Error ? error.message : String(error)}`,
        },
      }));
    } finally {
      setLoading((prev) => ({ ...prev, [toolId]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">ElevenLabs Tools Manager</h1>
            <p className="text-muted-foreground">
              Create and manage tools for your ElevenLabs agent
            </p>
          </div>
          <Link href="/">
            <Button variant="outline">Back to IDE</Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>API Configuration</CardTitle>
            <CardDescription>
              Enter your ElevenLabs API key to create and list tools
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder="Enter your ElevenLabs API key (xi-api-key)"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="max-w-md"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      fetchExistingTools();
                    }
                  }}
                />
                <Button
                  onClick={fetchExistingTools}
                  disabled={!apiKey.trim() || loadingTools}
                  variant="outline"
                >
                  {loadingTools ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Refresh Tools"
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Your API key is only used to make the request and is not stored
              </p>
              {toolsError && (
                <div className="p-3 rounded-md bg-red-50 dark:bg-red-950 text-red-900 dark:text-red-100 border border-red-200 dark:border-red-800 text-sm">
                  <p className="font-medium">Error fetching tools:</p>
                  <p>{toolsError}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Existing Tools List */}
        {existingTools.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Existing Tools ({existingTools.length})</CardTitle>
              <CardDescription>
                Tools that have already been created in your workspace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {existingTools.map((tool) => (
                  <div
                    key={tool.id}
                    className="flex items-center justify-between p-3 rounded-md border bg-muted/50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span className="font-medium">{tool.tool_config.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({tool.tool_config.type})
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {tool.tool_config.description}
                      </p>
                      <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                        <span>ID: {tool.id}</span>
                        <span>•</span>
                        <span>Calls: {tool.usage_stats.total_calls}</span>
                        <span>•</span>
                        <span>
                          Creator: {tool.access_info.creator_name || tool.access_info.creator_email}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {toolsConfig.map((tool) => (
            <Card key={tool.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle>{tool.name}</CardTitle>
                    <CardDescription>{tool.description}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setExpandedTool(expandedTool === tool.id ? null : tool.id)
                      }
                    >
                      {expandedTool === tool.id ? "Hide" : "Show"} JSON
                    </Button>
                    <Button
                      onClick={() => handleCreateTool(tool.id, tool.config)}
                      disabled={
                        loading[tool.id] ||
                        !apiKey.trim() ||
                        isToolExisting[tool.config.name] === true
                      }
                      size="sm"
                      title={
                        isToolExisting[tool.config.name]
                          ? "Tool already exists"
                          : undefined
                      }
                    >
                      {loading[tool.id] ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : isToolExisting[tool.config.name] ? (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Already Created
                        </>
                      ) : (
                        "Create Tool"
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {expandedTool === tool.id && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Tool Configuration JSON</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(JSON.stringify(tool.config, null, 2));
                        }}
                      >
                        Copy JSON
                      </Button>
                    </div>
                    <Textarea
                      value={JSON.stringify(tool.config, null, 2)}
                      readOnly
                      className="font-mono text-xs min-h-[300px]"
                    />
                  </div>
                )}

                {results[tool.id] && (
                  <div
                    className={`p-3 rounded-md text-sm ${
                      results[tool.id].success
                        ? "bg-green-50 dark:bg-green-950 text-green-900 dark:text-green-100 border border-green-200 dark:border-green-800"
                        : "bg-red-50 dark:bg-red-950 text-red-900 dark:text-red-100 border border-red-200 dark:border-red-800"
                    }`}
                  >
                    <p className="font-medium">
                      {results[tool.id].success ? "Success" : "Error"}
                    </p>
                    <pre className="mt-2 whitespace-pre-wrap text-xs">
                      {results[tool.id].message}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

