# Custom Voice Agent Research

## Overview

This document explores creating a custom voice agent using WebSocket for real-time conversations, where the text panel's LLM serves as the agent and responses are transcribed to speech instead of displaying as text.

## Architecture Concept

### Current Setup
- **Text Chat**: Uses LangChain + Groq/OpenAI for LLM responses
- **Voice Chat**: Uses ElevenLabs Conversational AI SDK with pre-configured agent
- **Code Generation**: AI generates code actions that are applied to files

### Proposed Custom Voice Agent Architecture

```
User Speech (Mic) 
  ↓
WebSocket Client (Browser)
  ↓
Speech-to-Text (Browser or Server)
  ↓
LLM Processing (Existing /api/chat endpoint)
  ↓
Text Response from LLM
  ↓
Text-to-Speech (ElevenLabs TTS API or WebSocket)
  ↓
Audio Output (Speakers)
```

## Technical Components

### 1. WebSocket Connection
- **Client-side**: Establish WebSocket connection for bidirectional communication
- **Server-side**: WebSocket server endpoint to handle real-time audio streaming
- **Protocol**: Can use native WebSocket API or libraries like `socket.io`

### 2. Speech-to-Text (STT)
**Option A: Browser-native (Web Speech API)**
```typescript
const recognition = new webkitSpeechRecognition();
recognition.continuous = true;
recognition.interimResults = true;
recognition.onresult = (event) => {
  const transcript = event.results[event.results.length - 1][0].transcript;
  // Send to LLM
};
```

**Option B: Server-side (ElevenLabs Scribe)**
- Stream audio chunks via WebSocket
- Server processes with ElevenLabs Scribe API
- Returns transcription in real-time

**Option C: WebRTC Data Channel**
- Use WebRTC for audio streaming
- More efficient for real-time communication

### 3. LLM Processing
- **Reuse existing `/api/chat` endpoint**
- Stream responses for real-time feel
- Handle code actions same as text chat

### 4. Text-to-Speech (TTS)
**Option A: ElevenLabs Streaming TTS**
```typescript
// From ELEVENLABS.txt docs
const ws = new WebSocket(
  `wss://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream-input?output_format=mp3_44100_128`
);
ws.send(JSON.stringify({ text: llmResponse }));
// Receive audio chunks and play
```

**Option B: ElevenLabs TTS API (HTTP)**
- Simpler but less real-time
- Good for complete responses

**Option C: Web Speech API (Browser)**
- Free but lower quality
- Good for prototyping

## Implementation Flow

### Client-Side Flow
1. **Start Conversation**:
   - Request microphone permission
   - Initialize WebSocket connection
   - Start speech recognition (STT)

2. **During Conversation**:
   - Capture audio → STT → Send text to server
   - Receive LLM response → TTS → Play audio
   - Handle interruptions (user speaks while AI is speaking)

3. **End Conversation**:
   - Stop STT
   - Close WebSocket
   - Release microphone

### Server-Side Flow
1. **WebSocket Handler**:
   - Accept STT transcripts
   - Call existing LLM endpoint (`/api/chat`)
   - Stream TTS audio back or text for client-side TTS

2. **Streaming Response**:
   - Use Server-Sent Events (SSE) or WebSocket for streaming
   - Process code actions in real-time
   - Send audio chunks as they're generated

## Key Considerations

### Pros
✅ **Full Control**: Complete control over conversation flow
✅ **Cost**: Potentially lower cost (pay per API call vs per minute)
✅ **Flexibility**: Customize LLM, STT, and TTS independently
✅ **Integration**: Directly use existing text chat LLM logic
✅ **Customization**: Easy to add custom features (interruptions, emotions, etc.)

### Cons
❌ **Complexity**: Much more complex to implement than ElevenLabs SDK
❌ **Latency**: Need to optimize for low latency
❌ **Error Handling**: Must handle WebSocket disconnections, STT errors, TTS failures
❌ **Turn-taking**: Need to implement turn-taking logic (when to listen vs speak)
❌ **Audio Quality**: Need to manage audio streams, buffers, playback

### Technical Challenges

1. **Turn-Taking Detection**
   - Detect when user stops speaking
   - Detect when AI should stop speaking (interruptions)
   - Implement silence detection
   - Handle overlapping speech

2. **Latency Optimization**
   - Stream TTS as soon as first tokens arrive
   - Use streaming LLM responses
   - Optimize WebSocket message size
   - Minimize round-trip delays

3. **Error Recovery**
   - Handle WebSocket reconnection
   - Retry failed STT/TTS requests
   - Graceful degradation (fallback to text)

4. **Audio Synchronization**
   - Prevent audio overlap
   - Queue audio chunks properly
   - Handle playback interruptions

## Recommended Approach

### Phase 1: Proof of Concept
1. **Browser STT + Server LLM + Browser TTS**
   - Use Web Speech API for STT (free, easy)
   - Use existing `/api/chat` for LLM
   - Use Web Speech API for TTS (free, lower quality)

### Phase 2: Improved Quality
2. **ElevenLabs TTS Integration**
   - Replace browser TTS with ElevenLabs streaming TTS
   - Use WebSocket for real-time audio streaming
   - Implement audio chunk buffering

### Phase 3: Production Ready
3. **Full WebSocket Pipeline**
   - Server-side STT (ElevenLabs Scribe or alternative)
   - Streaming LLM responses
   - Streaming TTS with turn-taking
   - Robust error handling

## Code Structure

```
src/
  components/
    VoiceAgent/
      VoiceAgent.tsx          # Main component
      STTManager.ts           # Speech-to-text handling
      TTSManager.ts           # Text-to-speech handling
      WebSocketManager.ts     # WebSocket connection
  hooks/
    useVoiceAgent.ts          # Voice agent hook
  api/
    websocket/
      route.ts                # WebSocket server endpoint
```

## Comparison: Custom vs ElevenLabs SDK

| Feature | Custom Voice Agent | ElevenLabs SDK |
|---------|-------------------|----------------|
| Setup Complexity | High | Low |
| Cost | Variable | Per-minute pricing |
| Control | Full | Limited |
| Turn-taking | Manual implementation | Built-in |
| Latency | Optimizable | Optimized |
| Maintenance | High | Low (managed) |
| Customization | Unlimited | Limited to SDK |

## Recommendation

**For MVP/Production**: Continue using ElevenLabs SDK
- Faster to market
- Battle-tested turn-taking
- Lower maintenance burden
- Good latency out-of-the-box

**For Future Enhancement**: Consider custom implementation if:
- Need specific customizations ElevenLabs doesn't support
- Cost optimization is critical
- Want complete control over conversation flow
- Building unique voice interaction patterns

## Next Steps for Research

1. **Prototype Phase 1** (Browser STT + LLM + Browser TTS)
   - Validate the concept works
   - Measure latency
   - Test user experience

2. **Evaluate ElevenLabs Streaming TTS**
   - Test WebSocket TTS API
   - Measure latency vs SDK
   - Compare audio quality

3. **Research Turn-Taking Algorithms**
   - Voice Activity Detection (VAD)
   - Silence detection
   - Interruption handling

4. **Cost Analysis**
   - Compare custom solution costs
   - Factor in development time
   - Calculate per-conversation costs

## Conclusion

A custom voice agent is **technically feasible** but requires significant engineering effort. The current ElevenLabs SDK approach is more practical for production use, but a custom solution could provide more flexibility and potential cost savings at the expense of complexity.

**Recommendation**: Start with a simple Phase 1 prototype to validate the concept, then decide if full implementation is worth the effort based on specific requirements and constraints.

