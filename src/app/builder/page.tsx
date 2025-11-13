"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import BuilderOrb from "@/components/BuilderOrb";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginDialog } from "@/components/auth/LoginDialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sparkles, Code, Zap, Globe, Layout, Rocket, Send, Plus, Eye, ThumbsUp, Figma, ChevronUp, Mic, Upload, Github, FileUp, Phone, PhoneOff, ChevronRight, CircleDot, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import GlassSurface from "@/components/ui/glass-surface";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CallPanel } from "@/components/CallPanel";
import ElectricBorder from "@/components/ui/electric-border";

const FRAMEWORKS = [
  { 
    value: "nextjs", 
    label: "Next.js", 
    image: "/next.svg", // Local image
    description: "React framework with SSR/SSG" 
  },
  { 
    value: "react", 
    label: "React", 
    image: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg", // CDN URL - will replace
    description: "Popular UI library" 
  },
  { 
    value: "vue", 
    label: "Vue", 
    image: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/vuejs/vuejs-original.svg", // CDN URL - will replace
    description: "Progressive framework" 
  },
  { 
    value: "angular", 
    label: "Angular", 
    image: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/angularjs/angularjs-original.svg", // CDN URL - will replace
    description: "Enterprise-grade framework" 
  },
  { 
    value: "svelte", 
    label: "Svelte", 
    image: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/svelte/svelte-original.svg", // CDN URL - will replace
    description: "Compiler-first framework" 
  },
];

const TEMPLATES = [
  {
    id: 1,
    name: "Brillance SaaS Landing Page",
    description: "Streamline your billing process with seamless automation",
    previewUrl: "https://ataeru-dev.vercel.app",
    creator: { name: "Ataeru", avatar: "AT" },
    views: 6000,
    likes: 964,
    framework: "nextjs",
  },
  {
    id: 2,
    name: "3D Gallery Photography Template",
    description: "Showcase your photography in a stunning 3D gallery",
    previewUrl: "https://zero-2-0.vercel.app",
    creator: { name: "Zero 2.0", avatar: "Z2" },
    views: 1800,
    likes: 403,
    framework: "react",
  },
  {
    id: 3,
    name: "AI Gateway Starter",
    description: "Connect to multiple AI services with a unified interface",
    previewUrl: "https://zenode.netlify.app",
    creator: { name: "Zenode", avatar: "ZN" },
    views: 499,
    likes: 89,
    framework: "nextjs",
  },
  {
    id: 4,
    name: "Pointer AI Landing Page",
    description: "Accelerate your development workflow with intelligent AI agents",
    previewUrl: "https://v0.app/templates/JUFK37Esjlj",
    creator: { name: "Alex Johnson", avatar: "AJ" },
    views: 14800,
    likes: 1100,
    framework: "nextjs",
  },
  {
    id: 5,
    name: "Dashboard – M.O.N.K.Y",
    description: "Comprehensive monitoring dashboard with analytics",
    previewUrl: "https://v0.app/templates/example",
    creator: { name: "Design Studio", avatar: "DS" },
    views: 7600,
    likes: 728,
    framework: "react",
  },
  {
    id: 6,
    name: "Skal Ventures Template",
    description: "Unlock your future growth with this modern landing page",
    previewUrl: "https://v0.app/templates/example",
    creator: { name: "Ventures Inc", avatar: "VI" },
    views: 3700,
    likes: 496,
    framework: "nextjs",
  },
  {
    id: 7,
    name: "E-commerce Store",
    description: "Full-featured online store with cart, checkout, and payment",
    previewUrl: "https://v0.app/templates/example",
    creator: { name: "Shopify Pro", avatar: "SP" },
    views: 9200,
    likes: 1250,
    framework: "nextjs",
  },
  {
    id: 8,
    name: "Blog Platform",
    description: "Modern blog with markdown support and SEO optimization",
    previewUrl: "https://v0.app/templates/example",
    creator: { name: "Content Team", avatar: "CT" },
    views: 5400,
    likes: 680,
    framework: "nextjs",
  },
  {
    id: 9,
    name: "Portfolio Site",
    description: "Beautiful portfolio showcase with animations",
    previewUrl: "https://v0.app/templates/example",
    creator: { name: "Design Co", avatar: "DC" },
    views: 4100,
    likes: 520,
    framework: "vue",
  },
  {
    id: 10,
    name: "Task Manager",
    description: "Collaborative task management with real-time updates",
    previewUrl: "https://v0.app/templates/example",
    creator: { name: "Productivity Labs", avatar: "PL" },
    views: 6300,
    likes: 780,
    framework: "react",
  },
];

export default function BuilderLandingPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, sessionToken } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [selectedFramework, setSelectedFramework] = useState("nextjs");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [frameworkPopoverOpen, setFrameworkPopoverOpen] = useState(false);
  const [frameworkHover, setFrameworkHover] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const callPanelRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async () => {
    if (!prompt.trim()) {
      toast.error("Please describe what you want to build");
      return;
    }

    // Check if user is authenticated
    if (!user) {
      setLoginDialogOpen(true);
      // Store prompt in sessionStorage to restore after login
      sessionStorage.setItem("builder_prompt", prompt);
      sessionStorage.setItem("builder_framework", selectedFramework);
      return;
    }

    setIsSubmitting(true);

    try {
      // Create builder project
      const response = await fetch("/api/builder/projects", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
        },
        body: JSON.stringify({
          name: `App: ${prompt.substring(0, 50)}`,
          description: prompt,
          framework: selectedFramework,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create project");
      }

      const data = await response.json();
      const projectId = data.project.id;

      // Start scaffolding process
      toast.info("Scaffolding your project... This may take a minute.");
      
      const scaffoldResponse = await fetch("/api/builder/scaffold", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
        },
        body: JSON.stringify({
          projectId,
          description: prompt,
        }),
      });

      if (!scaffoldResponse.ok) {
        const errorData = await scaffoldResponse.json();
        throw new Error(errorData.error || "Failed to scaffold project");
      }

      toast.success("Project scaffolded successfully! Redirecting...");
      
      // Redirect to build page
      setTimeout(() => {
        router.push(`/builder/build/${projectId}`);
      }, 1000);
    } catch (error) {
      console.error("Failed to create builder project:", error);
      toast.error(error instanceof Error ? error.message : "Failed to start building. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const scrollHeight = textarea.scrollHeight;
      const maxHeight = 200; // Max height for textarea
      textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
      if (scrollHeight > maxHeight) {
        textarea.style.overflowY = "auto";
      } else {
        textarea.style.overflowY = "hidden";
      }
    }
  }, [prompt]);

  // Restore prompt after login
  useEffect(() => {
    if (user && !prompt) {
      const savedPrompt = sessionStorage.getItem("builder_prompt");
      const savedFramework = sessionStorage.getItem("builder_framework");
      if (savedPrompt) {
        setPrompt(savedPrompt);
        if (savedFramework) setSelectedFramework(savedFramework);
        sessionStorage.removeItem("builder_prompt");
        sessionStorage.removeItem("builder_framework");
        // Auto-submit after login
        setTimeout(() => handleSubmit(), 500);
      }
    }
  }, [user]);

  const selectedFrameworkData = FRAMEWORKS.find(fw => fw.value === selectedFramework);

  if (authLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Enhanced background with gradient mesh */}
      <div className="fixed inset-0 -z-10">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-linear-to-br from-background via-background to-muted/30" />
        
        {/* Animated grid pattern - more visible */}
        <div className="absolute inset-0 opacity-80 dark:opacity-50">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_2px,transparent_2px),linear-gradient(to_bottom,hsl(var(--border))_2px,transparent_2px)] bg-size-[32px_32px] mask-[radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
        </div>
        
        {/* Gradient mesh overlay - more visible and vibrant */}
        <div className="absolute inset-0 opacity-60 dark:opacity-40">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/40 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/2 right-1/4 w-[600px] h-[600px] bg-purple-500/40 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/2 w-[600px] h-[600px] bg-pink-500/40 rounded-full blur-3xl" />
          <div className="absolute top-1/4 right-1/3 w-[500px] h-[500px] bg-blue-500/35 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 left-1/3 w-[450px] h-[450px] bg-cyan-500/30 rounded-full blur-3xl" />
        </div>
        
        {/* Radial gradient fade - more subtle */}
        <div className="absolute inset-0 bg-linear-to-t from-background/80 via-background/40 to-transparent" />
      </div>
      
      <LoginDialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen} />
      
      {/* Glass Header - Fixed and Floating */}
      <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-6xl">
        <GlassSurface
          width="100%"
          height={64}
          borderRadius={9999}
          backgroundOpacity={0.15}
          blur={12}
          saturation={1.8}
          className="px-6"
        >
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-primary" />
              <span className="text-lg font-bold">VibeCoder Builder</span>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              {user ? (
                <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
                  Go to Editor
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setLoginDialogOpen(true)}>
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </GlassSurface>
      </header>

      {/* Spacer for fixed header */}
      <div className="h-20" />

      {/* Hero Section */}
      <main className="w-full px-4 md:px-6 lg:px-8 py-16 relative z-10">
        <div className="max-w-6xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              AI-Powered Web Development
            </div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
              <span className="relative inline-block">
                <span className="absolute inset-0 bg-linear-to-r from-primary via-purple-500 to-pink-500 bg-size-[200%_auto] animate-gradient-x bg-clip-text text-transparent opacity-0">
                  Build Web Apps with AI Magic
                </span>
                <span className="relative bg-linear-to-r from-primary via-purple-500 to-pink-500 bg-size-[200%_auto] animate-gradient-x bg-clip-text text-transparent">
                  Build Web Apps with AI Magic
                </span>
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Transform your ideas into fully functional web applications in minutes, not months.
              Just describe what you want below, and our AI builds it for you.
            </p>
          </div>

          {/* AI Orb with call button */}
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="relative w-64 h-64">
              <BuilderOrb hoverIntensity={0.5} rotateOnHover={true} />
              {/* Voice conversation call button */}
              <button
                onClick={() => setIsCallActive(!isCallActive)}
                className={`absolute -bottom-18 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full border shadow-lg text-nowrap mb-10 transition-all ${
                  isCallActive
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background/90 backdrop-blur-sm border-border/50 hover:bg-background hover:border-primary/50"
                }`}
              >
                {isCallActive ? (
                  <>
                    <PhoneOff className="h-4 w-4" />
                    <span className="text-xs font-medium">End Call</span>
                  </>
                ) : (
                  <>
                    <Phone className="h-4 w-4 text-primary animate-pulse" />
                    <span className="text-xs font-medium text-foreground text-nowrap">Start Voice Call</span>
                  </>
                )}
              </button>
            </div>
            <div className="relative top-8">
                <p className="text-sm text-muted-foreground max-w-md">
                    Describe your app idea below, or use voice to talk with AI as it builds
                </p>
            </div>
          </div>
          
          {/* Hidden Call Panel */}
          {isCallActive && (
            <div className="fixed inset-0 z-50 pointer-events-none">
              <div ref={callPanelRef} className="absolute bottom-4 right-4 w-96 h-[600px] pointer-events-auto">
                <CallPanel
                  onStart={() => {}}
                  onEnd={() => setIsCallActive(false)}
                  isActive={isCallActive}
                  onCodeAction={async () => {}}
                  currentFile={undefined}
                  projectFiles={[]}
                  selectedCode={undefined}
                  projectId={undefined}
                  userId={user?.id || undefined}
                  isPlaygroundProject={false}
                />
              </div>
            </div>
          )}

          {/* Single Input Section (v0 style) */}
          <div className="max-w-4xl mx-auto w-full px-4 md:px-6">
            <div className="relative bg-background border rounded-lg shadow-lg p-4">
              <div className="flex items-start gap-2">
                {/* Plus button with dropdown */}
                <Popover open={frameworkPopoverOpen} onOpenChange={setFrameworkPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 mt-2"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-64 p-2">
                    <div className="space-y-1">
                      {/* Framework option - shows submenu on hover */}
                      <Popover open={frameworkHover} onOpenChange={setFrameworkHover}>
                        <PopoverTrigger asChild>
                          <button
                            onMouseEnter={() => setFrameworkHover(true)}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors"
                          >
                            <Code className="w-4 h-4 text-muted-foreground" />
                            <div className="flex-1 text-left">
                              <div className="text-sm font-medium">Framework</div>
                              <div className="text-xs text-muted-foreground">{selectedFrameworkData?.label || "Select framework"}</div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent 
                          side="right" 
                          align="start" 
                          className="w-64 p-2"
                          onMouseLeave={() => setFrameworkHover(false)}
                        >
                          <div className="space-y-1">
                            {FRAMEWORKS.map((fw) => (
                              <button
                                key={fw.value}
                                onClick={() => {
                                  setSelectedFramework(fw.value);
                                  setFrameworkHover(false);
                                  setFrameworkPopoverOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors ${
                                  selectedFramework === fw.value ? "bg-accent" : ""
                                }`}
                              >
                                {fw.value === "nextjs" ? (
                                  <Image
                                    src={fw.image}
                                    alt={fw.label}
                                    width={20}
                                    height={20}
                                    className="w-5 h-5"
                                  />
                                ) : (
                                  <img
                                    src={fw.image}
                                    alt={fw.label}
                                    className="w-5 h-5"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = "none";
                                    }}
                                  />
                                )}
                                <div className="flex-1 text-left">
                                  <div className="text-sm font-medium">{fw.label}</div>
                                  <div className="text-xs text-muted-foreground">{fw.description}</div>
                                </div>
                                {selectedFramework === fw.value && (
                                  <CircleDot className="h-4 w-4 text-primary" />
                                )}
                              </button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>

                      {/* File Upload option */}
                      <button
                        onClick={() => {
                          fileInputRef.current?.click();
                          setFrameworkPopoverOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors"
                      >
                        <Upload className="w-4 h-4 text-muted-foreground" />
                        <div className="flex-1 text-left">
                          <div className="text-sm font-medium">Upload Files</div>
                          <div className="text-xs text-muted-foreground">Upload local project files</div>
                        </div>
                      </button>

                      {/* GitHub Import option */}
                      <button
                        onClick={() => {
                          // TODO: Implement GitHub import modal
                          toast.info("GitHub import coming soon");
                          setFrameworkPopoverOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors"
                      >
                        <Github className="w-4 h-4 text-muted-foreground" />
                        <div className="flex-1 text-left">
                          <div className="text-sm font-medium">Import from GitHub</div>
                          <div className="text-xs text-muted-foreground">Clone and import repository</div>
                        </div>
                      </button>

                      {/* Figma option */}
                      <button
                        onClick={() => {
                          toast.info("Figma integration coming soon");
                          setFrameworkPopoverOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors"
                      >
                        <Figma className="w-4 h-4 text-muted-foreground" />
                        <div className="flex-1 text-left">
                          <div className="text-sm font-medium">Add from Figma</div>
                          <div className="text-xs text-muted-foreground">Import design from Figma</div>
                        </div>
                      </button>
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  {...({ webkitdirectory: "" } as any)}
                  {...({ directory: "" } as any)}
                  className="hidden"
                  onChange={(e) => {
                    // TODO: Handle file uploads for builder
                    if (e.target.files && e.target.files.length > 0) {
                      toast.info("File upload processing - coming soon");
                    }
                  }}
                />

                {/* Textarea with auto-resize */}
                <Textarea
                  ref={textareaRef}
                  placeholder="Ask VibeCoder to build..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  className="flex-1 min-h-[60px] max-h-[200px] resize-none text-base border-0 focus-visible:ring-0 focus-visible:ring-offset-0 pr-12"
                  disabled={isSubmitting}
                  rows={1}
                />

                {/* Send button inside input */}
                <Button
                  size="icon"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !prompt.trim()}
                  className="h-8 w-8 shrink-0 mt-2 bg-primary hover:bg-primary/90"
                >
                    <div className="scale-[1.4]">
                        <ArrowUpRight className="h-4 w-4 -rotate-45" />
                    </div>
                </Button>
              </div>
              
              {/* Framework indicator */}
              {selectedFrameworkData && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t">
                  <span className="text-xs text-muted-foreground">Framework:</span>
                  <div className="flex items-center gap-2">
                    {selectedFrameworkData.value === "nextjs" ? (
                      <Image
                        src={selectedFrameworkData.image}
                        alt={selectedFrameworkData.label}
                        width={16}
                        height={16}
                        className="w-4 h-4"
                      />
                    ) : (
                      <img
                        src={selectedFrameworkData.image}
                        alt={selectedFrameworkData.label}
                        className="w-4 h-4"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    )}
                    <span className="text-xs font-medium">{selectedFrameworkData.label}</span>
                  </div>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Press ⌘+Enter or Ctrl+Enter to build
            </p>
          </div>

          {/* Features Section - Alternating Layout with Electric Borders */}
          <div className="mt-24 space-y-16 w-full px-4 md:px-6 lg:px-8">
            <div className="text-center space-y-4 max-w-3xl mx-auto">
              <h2 className="text-4xl font-bold">Why Build with AI?</h2>
              <p className="text-lg text-muted-foreground">
                Stop spending weeks building from scratch. Our AI understands modern web development
                patterns and generates production-ready code that follows industry best practices.
              </p>
            </div>

            {/* Feature 1 - Text Left, Image Right with Electric Border */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                <div className="w-14 h-14 rounded-xl bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Zap className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-3xl font-bold">10x Faster Development</h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Turn ideas into working prototypes in minutes. What used to take weeks now takes hours.
                  Focus on your vision while AI handles the boilerplate and repetitive code.
                </p>
              </div>
              <ElectricBorder
                topColor="#3B82F6"
                bottomColor="#8B5CF6"
                thickness={2}
                speed={1.2}
                className="w-full rounded-2xl overflow-hidden"
                style={{ borderRadius: '1rem', height: '320px' }}
              >
                <div className="relative w-full h-full rounded-xl overflow-hidden bg-linear-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 flex items-center justify-center">
                  <img 
                    src="https://cdni.iconscout.com/illustration/premium/thumb/engineers-doing-development-operations-illustration-svg-download-png-3455059.png" 
                    alt="AI Development"
                    className="w-full h-full object-cover opacity-70"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800&h=600&fit=crop&q=80";
                    }}
                  />
                </div>
              </ElectricBorder>
            </div>

            {/* Feature 2 - Image Left with Electric Border, Text Right */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <ElectricBorder
                topColor="#A855F7"
                bottomColor="#F97316"
                thickness={2}
                speed={1.2}
                className="w-full rounded-2xl overflow-hidden order-2 lg:order-1"
                style={{ borderRadius: '1rem', height: '320px' }}
              >
                <div className="relative w-full h-full rounded-xl overflow-hidden bg-linear-to-br from-purple-500/20 via-pink-500/20 to-orange-500/20 flex items-center justify-center">
                  <img 
                    src="https://t4.ftcdn.net/jpg/04/14/26/07/240_F_414260747_5WOXozB6E8ECfRPOUFOOCqYju4vhKsoG.jpg" 
                    alt="Code Development"
                    className="w-full h-full object-cover opacity-70"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=600&fit=crop&q=80";
                    }}
                  />
                </div>
              </ElectricBorder>
              <div className="space-y-6 order-1 lg:order-2">
                <div className="w-14 h-14 rounded-xl bg-linear-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                  <Code className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-3xl font-bold">Production-Grade Code</h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Clean, maintainable code that follows best practices. Built with shadcn/ui,
                  TypeScript, and modern frameworks. Ready to deploy and scale.
                </p>
              </div>
            </div>

            {/* Feature 3 - Text Left, Image Right with Electric Border */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                <div className="w-14 h-14 rounded-xl bg-linear-to-br from-green-500 to-teal-600 flex items-center justify-center">
                  <Mic className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-3xl font-bold">Voice-Powered Interface</h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Talk to your AI builder naturally. Iterate, refine, and build features through
                  voice conversation. No typing required—just describe what you want.
                </p>
              </div>
              <ElectricBorder
                topColor="#3a30c5"
                bottomColor="#14B8A6"
                thickness={2}
                speed={1.2}
                className="w-full rounded-2xl overflow-hidden"
                style={{ borderRadius: '1rem', height: '320px' }}
              >
                <div className="relative w-full h-full rounded-xl overflow-hidden bg-linear-to-br from-green-500/20 via-teal-500/20 to-cyan-500/20 flex items-center justify-center">
                  <img 
                    src="https://static.vecteezy.com/system/resources/previews/036/289/586/large_2x/smart-voice-assistant-flat-illustration-template-female-character-control-home-iot-system-through-wireless-commands-on-speakers-and-microphone-virtual-assistant-voice-control-on-tab-screen-vector.jpg" 
                    alt="Voice Interface"
                    className="w-full h-full object-cover opacity-70"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&h=600&fit=crop&q=80";
                    }}
                  />
                </div>
              </ElectricBorder>
            </div>
          </div>

          {/* Templates Section - Full Width Like Vercel */}
          <div className="mt-24 space-y-8 w-full px-4 sm:px-6 lg:px-1">
            <div className="text-center space-y-2 max-w-3xl mx-auto">
              <h2 className="text-4xl font-bold">Explore Templates</h2>
              <p className="text-lg text-muted-foreground">
                Get started with pre-built professional templates from the community
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 md:gap-5 w-full">
              {TEMPLATES.map((template) => (
                <Card
                  key={template.id}
                  className="cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all group overflow-hidden border hover:border-primary/50 bg-card"
                  onClick={() => {
                    setPrompt(`Build a ${template.name.toLowerCase()}: ${template.description}`);
                    setSelectedFramework(template.framework);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  {/* Screenshot preview - larger like Vercel */}
                  <div className="relative w-full aspect-video bg-muted/30 overflow-hidden rounded-t-lg">
                    <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-purple-500/5 to-pink-500/5" />
                    <iframe
                      src={template.previewUrl}
                      className="w-full h-full scale-75 origin-top-left pointer-events-none opacity-60 group-hover:opacity-80 transition-opacity"
                      style={{ width: "133.33%", height: "133.33%" }}
                      sandbox="allow-same-origin"
                      title={`${template.name} preview`}
                    />
                  </div>
                  
                  <CardHeader className="p-4 space-y-3">
                    <div>
                      <CardTitle className="text-base font-semibold leading-tight mb-1">{template.name}</CardTitle>
                      <CardDescription className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {template.description}
                      </CardDescription>
                    </div>
                    
                    {/* Creator info and stats */}
                    <div className="flex items-center justify-between pt-2 border-t border-border/50">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                          {template.creator.avatar}
                        </div>
                        <span className="text-xs text-muted-foreground truncate">{template.creator.name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0 ml-2">
                        <div className="flex items-center gap-1">
                          <Eye className="h-3.5 w-3.5" />
                          <span>{template.views >= 1000 ? `${(template.views / 1000).toFixed(1)}K` : template.views}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <ThumbsUp className="h-3.5 w-3.5" />
                          <span>{template.likes >= 1000 ? `${(template.likes / 1000).toFixed(1)}K` : template.likes}</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-24">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-primary" />
              <span className="font-semibold">VibeCoder Builder</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground">Docs</a>
              <a href="#" className="hover:text-foreground">Templates</a>
              <a href="#" className="hover:text-foreground">Support</a>
              <a href="#" className="hover:text-foreground">Privacy</a>
            </div>
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} VibeCoder. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

