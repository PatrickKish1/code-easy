"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Orb from "@/components/Orb";
import VideoOrb from "@/components/VideoOrb";
import { ChatPanel } from "@/components/ide/ChatPanel";
import * as React from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Phone, MessageSquare } from "lucide-react";
import { useConversation } from "@elevenlabs/react";

type CallPanelProps = {
  onStart: () => void;
  onEnd: () => void;
  isActive: boolean;
  onCodeAction?: (action: any) => void;
  currentFile?: string;
  projectFiles?: Array<{ path: string; content: string }>;
  selectedCode?: string;
  projectId?: string;
};

export function CallPanel({ onStart, onEnd, isActive, onCodeAction, currentFile, projectFiles, selectedCode, projectId }: CallPanelProps) {
  const [orbType, setOrbType] = React.useState("shader");
  
  // Initialize ElevenLabs conversation
  const conversation = useConversation({
    onConnect: () => {
      console.log('ElevenLabs: Connected');
      onStart();
    },
    onDisconnect: () => {
      console.log('ElevenLabs: Disconnected');
      onEnd();
    },
    onMessage: (message) => {
      console.log('ElevenLabs Message:', message);
    },
    onError: (error) => {
      console.error('ElevenLabs Error:', error);
    },
  });

  // Audio level tracking for orb visualization
  const levelRef = React.useRef(0);
  const audioContextRef = React.useRef<AudioContext | null>(null);
  const analyserRef = React.useRef<AnalyserNode | null>(null);
  const dataArrayRef = React.useRef<Uint8Array | null>(null);
  const animationFrameRef = React.useRef<number | null>(null);
  const micStreamRef = React.useRef<MediaStream | null>(null);

  // Start audio level monitoring for orb visualization
  const startAudioMonitoring = React.useCallback((stream: MediaStream) => {
    if (typeof window === "undefined" || audioContextRef.current) return;
    
    try {
      micStreamRef.current = stream;
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 1024;
      source.connect(analyserRef.current);
      const bufferLength = analyserRef.current.frequencyBinCount;
      const buffer = new ArrayBuffer(bufferLength);
      dataArrayRef.current = new Uint8Array(buffer);

      const tick = () => {
        animationFrameRef.current = requestAnimationFrame(tick);
        if (!analyserRef.current || !dataArrayRef.current) return;
        
        // Type assertion to satisfy TypeScript's strict ArrayBuffer typing
        // getByteTimeDomainData works with Uint8Array, but TS infers ArrayBufferLike type
        analyserRef.current.getByteTimeDomainData(dataArrayRef.current as any);
        
        // Compute RMS for amplitude 0..1
        let sum = 0;
        for (let i = 0; i < dataArrayRef.current.length; i++) {
          const v = (dataArrayRef.current[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / dataArrayRef.current.length);
        levelRef.current = Math.min(1, rms * 3);
      };
      tick();
    } catch (error) {
      console.error('Failed to start audio monitoring:', error);
    }
  }, []);

  // Stop audio level monitoring
  const stopAudioMonitoring = React.useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    dataArrayRef.current = null;
    levelRef.current = 0;
  }, []);

  // Start conversation handler
  const handleStartConversation = React.useCallback(async () => {
    try {
      const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;
      if (!agentId) {
        console.error('ElevenLabs Agent ID not configured');
        alert('ElevenLabs Agent ID is not configured. Please set NEXT_PUBLIC_ELEVENLABS_AGENT_ID in your environment variables.');
        return;
      }

      // Request microphone permission first
      let micStream: MediaStream;
      try {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Start audio monitoring for orb visualization with the mic stream
        startAudioMonitoring(micStream);
      } catch (micError) {
        console.error('Microphone permission denied:', micError);
        alert('Microphone access is required for voice conversations. Please grant permission and try again.');
        return;
      }

      // Try WebRTC first, fallback to WebSocket if it fails
      try {
        await conversation.startSession({
          agentId: agentId,
          connectionType: 'webrtc',
          userId: projectId || 'anonymous',
        });
      } catch (webrtcError: any) {
        console.warn('WebRTC connection failed, trying WebSocket:', webrtcError);
        // Stop the previous session attempt if it partially started
        try {
          await conversation.endSession();
        } catch {}
        
        // Fallback to WebSocket
        try {
          await conversation.startSession({
            agentId: agentId,
            connectionType: 'websocket',
            userId: projectId || 'anonymous',
          });
        } catch (wsError) {
          console.error('WebSocket connection also failed:', wsError);
          throw wsError;
        }
      }
    } catch (error: any) {
      console.error('Failed to start conversation:', error);
      stopAudioMonitoring();
      const errorMessage = error?.message || 'Unknown error';
      alert(`Failed to start conversation: ${errorMessage}. Please check your internet connection and try again.`);
    }
  }, [conversation, startAudioMonitoring, stopAudioMonitoring, projectId]);

  // End conversation handler
  const handleEndConversation = React.useCallback(async () => {
    try {
      await conversation.endSession();
      stopAudioMonitoring();
    } catch (error) {
      console.error('Failed to end conversation:', error);
    }
  }, [conversation, stopAudioMonitoring]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      stopAudioMonitoring();
    };
  }, [stopAudioMonitoring]);

  // Use conversation status for isActive
  const conversationActive = conversation.status === 'connected';

  return (
    <Card className="h-full flex flex-col scale-[0.95]">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle>AI Assistant</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="secondary">Orb: {orbType.startsWith("video") ? "Video" : "Reactive"}</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => setOrbType("shader")}>Reactive Orb</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setOrbType("video:purple")}>Purple Orb (video)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setOrbType("video:dusty")}>Dusty Stars (video)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setOrbType("video:particle")}>Particle Lit (video)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setOrbType("video:golden")}>Golden Yellow (video)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="p-0 flex-1 min-h-0 overflow-hidden">
        <Tabs defaultValue="chat" className="h-full flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Text Chat
            </TabsTrigger>
            <TabsTrigger value="call" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Live Call
            </TabsTrigger>
          </TabsList>
          <TabsContent value="chat" className="flex-1 min-h-0 m-0 overflow-hidden">
            <ChatPanel
              onCodeAction={onCodeAction || (() => {})}
              currentFile={currentFile}
              projectFiles={projectFiles}
              selectedCode={selectedCode}
              projectId={projectId}
            />
          </TabsContent>
          <TabsContent value="call" className="flex-1 min-h-0 m-0">
            <div className="p-4">
              <div className="text-sm text-muted-foreground mb-4">Voice conversation</div>
              <div className="mx-auto rounded-full overflow-hidden" style={{ height: 240, width: 240, aspectRatio: '1/1' }}>
                {orbType === "shader" ? (
                  <Orb hoverIntensity={0.5} rotateOnHover={true} hue={0} forceHoverState={conversation.isSpeaking || false} audioLevel={levelRef.current} />
                ) : orbType === "video:purple" ? (
                  <VideoOrb src="/orbs/purple-orb.mp4" />
                ) : orbType === "video:dusty" ? (
                  <VideoOrb src="/orbs/dusty-stars-orb.mp4" />
                ) : orbType === "video:particle" ? (
                  <VideoOrb src="/orbs/particle-lit-orb.mp4" />
                ) : (
                  <VideoOrb src="/orbs/golden-yello-ord.mp4" />
                )}
              </div>
              <div className="flex gap-2 mt-4">
                {!conversationActive ? (
                  <Button 
                    onClick={handleStartConversation}
                    disabled={conversation.status === 'connecting'}
                  >
                    {conversation.status === 'connecting' ? 'Connecting...' : 'Start Conversation'}
                  </Button>
                ) : (
                  <Button 
                    variant="destructive" 
                    onClick={handleEndConversation}
                  >
                    End Conversation
                  </Button>
                )}
              </div>
              {conversationActive && (
                <div className="text-sm text-muted-foreground mt-2 text-center">
                  Status: {conversation.isSpeaking ? 'Agent is speaking...' : 'Listening...'}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}


