"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Orb from "@/components/Orb";
import VideoOrb from "@/components/VideoOrb";
import { ChatPanel } from "@/components/ide/ChatPanel";
import { LiveWaveform } from "@/components/ui/live-waveform";
import { MicSelector } from "@/components/ui/mic-selector";
import { VoicePicker, Voice } from "@/components/ui/voice-picker";
import * as React from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Phone, MessageSquare, Settings, Mic, MicOff } from "lucide-react";
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
  const [selectedMic, setSelectedMic] = React.useState<string>("");
  const [isMuted, setIsMuted] = React.useState(false);
  const [selectedVoice, setSelectedVoice] = React.useState<string>("");
  const [voices, setVoices] = React.useState<Voice[]>([]);
  const waveformStreamRef = React.useRef<MediaStream | null>(null);
  const [showWaveform, setShowWaveform] = React.useState(false);
  const [loadingVoices, setLoadingVoices] = React.useState(false);
  // Separate stream ref for persistent mic preview (starts disabled)
  const previewMicStreamRef = React.useRef<MediaStream | null>(null);
  const [showPreviewWaveform, setShowPreviewWaveform] = React.useState(false);
  const [previewMicEnabled, setPreviewMicEnabled] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  
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
      // Note: MediaStream.clone() might not be available in all browsers
      // LiveWaveform will use the stream via onStreamReady callback
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
    if (waveformStreamRef.current) {
      waveformStreamRef.current.getTracks().forEach(track => track.stop());
      waveformStreamRef.current = null;
      setShowWaveform(false);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    dataArrayRef.current = null;
    levelRef.current = 0;
  }, []);

  // Fetch voices on mount
  React.useEffect(() => {
    const fetchVoices = async () => {
      setLoadingVoices(true);
      try {
        const response = await fetch("/api/voices");
        if (response.ok) {
          const data = await response.json();
          setVoices(data.voices || []);
        } else {
          console.error('Failed to fetch voices:', await response.text());
        }
      } catch (error) {
        console.error('Failed to fetch voices:', error);
      } finally {
        setLoadingVoices(false);
      }
    };
    fetchVoices();
  }, []);

  // Initialize/cleanup mic preview stream based on user toggle
  React.useEffect(() => {
    if (previewMicEnabled) {
      const initPreviewMic = async () => {
        try {
          const constraints: MediaStreamConstraints = {
            audio: selectedMic
              ? { deviceId: { exact: selectedMic } }
              : true,
          };
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          previewMicStreamRef.current = stream;
          setShowPreviewWaveform(true);
        } catch (error) {
          console.error('Failed to initialize preview mic:', error);
          setShowPreviewWaveform(false);
          setPreviewMicEnabled(false);
        }
      };
      initPreviewMic();
    } else {
      if (previewMicStreamRef.current) {
        previewMicStreamRef.current.getTracks().forEach(track => track.stop());
        previewMicStreamRef.current = null;
        setShowPreviewWaveform(false);
      }
    }

    return () => {
      if (previewMicStreamRef.current) {
        previewMicStreamRef.current.getTracks().forEach(track => track.stop());
        previewMicStreamRef.current = null;
        setShowPreviewWaveform(false);
      }
    };
  }, [previewMicEnabled, selectedMic]);

  // Start conversation handler
  const handleStartConversation = React.useCallback(async () => {
    try {
      const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;
      if (!agentId) {
        console.error('ElevenLabs Agent ID not configured');
        alert('ElevenLabs Agent ID is not configured. Please set NEXT_PUBLIC_ELEVENLABS_AGENT_ID in your environment variables.');
        return;
      }

      // Request microphone permission with selected device
      let micStream: MediaStream;
      try {
        const constraints: MediaStreamConstraints = {
          audio: selectedMic
            ? { deviceId: { exact: selectedMic } }
            : true,
        };
        micStream = await navigator.mediaDevices.getUserMedia(constraints);
        // Start audio monitoring for orb visualization with the mic stream
        startAudioMonitoring(micStream);
        waveformStreamRef.current = micStream;
        setShowWaveform(true);
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
          <TabsContent value="call" className="flex-1 min-h-0 m-0 overflow-hidden">
            <div className="p-4 h-full flex flex-col">
              <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                <div className="w-full flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <DropdownMenu open={settingsOpen} onOpenChange={setSettingsOpen}>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-64">
                        <div className="p-2 space-y-2">
                          <div className="text-xs font-medium text-muted-foreground mb-1">Microphone</div>
                          <MicSelector
                            value={selectedMic}
                            onValueChange={setSelectedMic}
                            muted={isMuted}
                            onMutedChange={setIsMuted}
                            disabled={conversation.status === 'connecting'}
                          />
                          {loadingVoices ? (
                            <div className="text-xs text-muted-foreground text-center py-2">
                              Loading voices...
                            </div>
                          ) : voices.length > 0 ? (
                            <>
                              <div className="text-xs font-medium text-muted-foreground mb-1 mt-3">Voice</div>
                              <VoicePicker
                                voices={voices}
                                value={selectedVoice}
                                onValueChange={setSelectedVoice}
                                placeholder="Select voice (optional)"
                              />
                            </>
                          ) : null}
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <span className="text-sm text-muted-foreground">Voice conversation</span>
                  </div>
                </div>
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
                
                {/* Mic preview waveform with toggle */}
                <div className="w-full max-w-xs">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPreviewMicEnabled(!previewMicEnabled)}
                      className="h-8 w-8 p-0"
                      title={previewMicEnabled ? "Disable mic preview" : "Enable mic preview"}
                    >
                      {previewMicEnabled ? (
                        <Mic className="h-4 w-4 text-green-500" />
                      ) : (
                        <MicOff className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                    <span className="text-xs text-muted-foreground">Microphone Preview</span>
                  </div>
                  {previewMicEnabled && showPreviewWaveform ? (
                    <LiveWaveform
                      active={!isMuted && !!previewMicStreamRef.current}
                      stream={previewMicStreamRef.current}
                      mode="static"
                      height={50}
                      barWidth={3}
                      barGap={1}
                      sensitivity={2}
                    />
                  ) : (
                    <div className="h-[50px] w-full border border-dashed border-muted-foreground/20 rounded flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">Click mic icon to enable preview</span>
                    </div>
                  )}
                </div>

                {/* Live Waveform for active call feedback */}
                {conversationActive && showWaveform && (
                  <div className="w-full max-w-xs">
                    <div className="text-xs text-muted-foreground mb-1 text-center">Call Audio Level</div>
                    <LiveWaveform
                      active={!isMuted && !!waveformStreamRef.current}
                      stream={waveformStreamRef.current}
                      mode="static"
                      height={50}
                      barWidth={3}
                      barGap={1}
                      sensitivity={2}
                    />
                  </div>
                )}

                {/* Controls */}
                <div className="w-full space-y-3">
                  {!conversationActive ? (
                    <Button 
                      onClick={handleStartConversation}
                      disabled={conversation.status === 'connecting'}
                      className="w-full"
                    >
                      {conversation.status === 'connecting' ? 'Connecting...' : 'Start Conversation'}
                    </Button>
                  ) : (
                    <Button 
                      variant="destructive" 
                      onClick={handleEndConversation}
                      className="w-full"
                    >
                      End Conversation
                    </Button>
                  )}
                </div>

                {conversationActive && (
                  <div className="text-sm text-muted-foreground text-center">
                    Status: {conversation.isSpeaking ? 'Agent is speaking...' : isMuted ? 'Muted' : 'Listening...'}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}


