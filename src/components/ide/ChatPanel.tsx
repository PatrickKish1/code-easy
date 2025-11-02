"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Code, FileText, Bot } from "lucide-react";
import { CodeGenerationResponse } from "@/lib/ai-service";
import { Message, MessageAvatar, MessageContent } from "@/components/ui/message";
import Orb from "@/components/Orb";
import { MessageRenderer } from "./MessageRenderer";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  codeActions?: CodeGenerationResponse["codeActions"];
}

interface ChatPanelProps {
  onCodeAction: (
    action: NonNullable<CodeGenerationResponse["codeActions"]>[number]
  ) => void;
  currentFile?: string;
  projectFiles?: Array<{ path: string; content: string }>;
  selectedCode?: string;
  projectId?: string;
}

export function ChatPanel({ onCodeAction, currentFile, projectFiles, selectedCode, projectId }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Create a new thread when component mounts
    createNewThread();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Subscribe to realtime file updates to reflect external changes
  useEffect(() => {
    try {
      const es = new EventSource(`/api/realtime`);
      const handler = (e: MessageEvent) => {
        // Optionally handle incoming events if we want to reflect streaming updates
        // For now, no-op; UI already listens to local state updates.
      };
      es.addEventListener("file:created", handler as any);
      es.addEventListener("file:updated", handler as any);
      es.addEventListener("file:renamed", handler as any);
      es.addEventListener("file:deleted", handler as any);
      return () => {
        es.close();
      };
    } catch {}
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const createNewThread = async () => {
    try {
      const response = await fetch("/api/thread", { method: "POST" });
      const data = await response.json();
      if (data.threadId) {
        setThreadId(data.threadId);
      }
    } catch (error) {
      console.error("Failed to create thread:", error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !threadId) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId,
          prompt: currentInput,
          context: {
            currentFile,
            projectFiles,
            selectedCode,
            appwriteProjectId: projectId,
          },
        }),
      });

      const data: CodeGenerationResponse = await response.json();

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message,
        timestamp: Date.now(),
        codeActions: data.codeActions,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Failed to send message:", error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const executeCodeAction = (
    action: NonNullable<CodeGenerationResponse["codeActions"]>[number]
  ) => {
    console.log("ChatPanel: Executing code action:", action);
    onCodeAction(action);
  };

  return (
    <div className="h-full min-h-0 flex flex-col">
      <div className="px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          <span className="font-semibold">AI Coding Assistant</span>
        </div>
      </div>
      
      <div className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="h-full max-h-full p-4">
          <div className="space-y-4 pr-2">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <div className="h-12 w-12 rounded-full overflow-hidden mx-auto mb-4">
                  <Orb hoverIntensity={0.3} rotateOnHover={false} hue={240} />
                </div>
                <div>
                  <p>Start a conversation with the AI coding assistant</p>
                  <p className="text-sm">Ask me to generate code, fix bugs, or explain concepts</p>
                </div>
              </div>
            )}
            {messages.map((message) => (
              <Message key={message.id} from={message.role}>
                <div className="h-8 w-8 rounded-full overflow-hidden shrink-0">
                  {message.role === "user" ? (
                    <Orb hoverIntensity={0.3} rotateOnHover={false} hue={120} />
                  ) : (
                    <Orb hoverIntensity={0.3} rotateOnHover={false} hue={240} />
                  )}
                </div>
                <MessageContent variant="contained">
                  <MessageRenderer 
                    content={message.content} 
                    codeActions={message.codeActions}
                  />
                  {message.codeActions && message.codeActions.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <div className="text-sm font-medium">Code Actions:</div>
                      {message.codeActions.map((action, index) => (
                        <div
                          key={index}
                          className="bg-background/50 rounded p-2 border"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="font-mono text-sm truncate">
                                {action.type.toUpperCase()}: {action.path}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {action.description}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => executeCodeAction(action)}
                              className="shrink-0"
                            >
                              <Code className="h-3 w-3 mr-1" />
                              Apply
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </MessageContent>
              </Message>
            ))}
            {isLoading && (
              <Message from="assistant">
                <div className="h-8 w-8 rounded-full overflow-hidden shrink-0">
                  <Orb hoverIntensity={0.3} rotateOnHover={false} hue={240} />
                </div>
                <MessageContent variant="contained">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                    <span>Thinking...</span>
                  </div>
                </MessageContent>
              </Message>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>
      
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me to generate code, fix bugs, or explain concepts..."
            disabled={isLoading}
            className="flex-1 min-w-0"
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            size="sm"
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
