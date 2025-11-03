# ElevenLabs Integration Setup Guide

This guide explains how to configure your ElevenLabs agent to generate code via voice conversations.

## Overview

**Complete Flow:**
1. User speaks to ElevenLabs agent (voice)
2. Agent processes request and calls server tools (webhooks)
3. Webhooks update files in Appwrite
4. Server-Sent Events (SSE) broadcast changes
5. Frontend automatically updates with new/modified files

## Prerequisites

1. Deploy your Next.js app (Vercel, Netlify, etc.)
2. Get your deployed webhook URL: `https://your-domain.com/api/webhooks/elevenlabs`
3. Have an ElevenLabs agent created

## Step 1: Configure ElevenLabs Server Tools

Go to your ElevenLabs agent dashboard → **Agent** tab → **Tools** section → **Add Tool**

### Tool 1: Create/Update File

**Configuration:**
- **Name**: `create_or_update_file`
- **Description**: `Create a new file or update an existing file in the project. Use this when the user wants to generate new code or modify existing code.`
- **Method**: `POST`
- **URL**: `https://your-deployed-domain.com/api/webhooks/elevenlabs`

**Body Parameters:**
| Data Type | Identifier | Required | Description |
|-----------|------------|----------|-------------|
| string | action_type | Yes | The action to perform: "create" or "update" |
| string | file_path | Yes | The file path (e.g., "src/components/Button.tsx") |
| string | file_content | Yes | The complete file content including code |
| string | project_id | Yes | The Appwrite project ID (pass this via dynamic variable or user_id) |
| string | description | No | Brief description of what the code does |

**Headers:**
- None required (unless you want to add authentication)

### Tool 2: Delete File

**Configuration:**
- **Name**: `delete_file`
- **Description**: `Delete a file from the project. Use this when the user wants to remove a file.`
- **Method**: `POST`
- **URL**: `https://your-deployed-domain.com/api/webhooks/elevenlabs`

**Body Parameters:**
| Data Type | Identifier | Required | Description |
|-----------|------------|----------|-------------|
| string | action_type | Yes | Set to "delete" |
| string | file_path | Yes | The file path to delete |
| string | project_id | Yes | The Appwrite project ID |
| boolean | is_folder | No | Set to true if deleting a folder |

### Tool 3: Rename File

**Configuration:**
- **Name**: `rename_file`
- **Description**: `Rename a file or folder in the project.`
- **Method**: `POST`
- **URL**: `https://your-deployed-domain.com/api/webhooks/elevenlabs`

**Body Parameters:**
| Data Type | Identifier | Required | Description |
|-----------|------------|----------|-------------|
| string | action_type | Yes | Set to "rename" |
| string | file_path | Yes | Current file path |
| string | new_path | Yes | New file path |
| string | project_id | Yes | The Appwrite project ID |

### Tool 4: Get Project Files (Optional - for reading existing code)

**Configuration:**
- **Name**: `get_project_files`
- **Description**: `Get a list of all files in the project or read a specific file's content. Use this to understand the existing codebase before making changes.`
- **Method**: `GET`
- **URL**: `https://your-deployed-domain.com/api/files?project_id={project_id}`

**Query Parameters:**
| Data Type | Identifier | Required | Description |
|-----------|------------|----------|-------------|
| string | project_id | Yes | The Appwrite project ID |

## Step 2: Update Your Agent System Prompt

Your current CodeBot prompt is great! Add this section at the end to enable tool usage:

```
# Tools Available

You have access to file management tools that let you interact with the user's codebase:

- `create_or_update_file`: Create new files or update existing files with complete code
- `delete_file`: Remove files or folders from the project
- `rename_file`: Rename files or folders
- `get_project_files`: Read existing files to understand the current codebase

## Tool Usage Guidelines

**When creating new code:**
- Use `create_or_update_file` with `action_type="create"`
- Always provide complete, working code in `file_content` (not snippets)
- Include all necessary imports and dependencies
- Add helpful comments and documentation

**When modifying existing code:**
1. First, use `get_project_files` to read the existing file
2. Analyze the current code structure, imports, and patterns
3. Use `create_or_update_file` with `action_type="update"` to modify it
4. Preserve existing functionality while adding requested changes

**When deleting files:**
- Use `delete_file` tool with the file path
- Confirm deletion is what the user wants before proceeding

**When renaming files:**
- Use `rename_file` tool with current and new paths
- Update any imports that reference the renamed file

**Important:**
- The `project_id` is: 68c9f40a002d5afe6b43 (always use this value)
- Always provide complete, working code - never partial snippets
- When updating files, read them first to preserve existing code and structure
- Think step-by-step: understand → read (if needed) → generate → save

**Example workflow for modifying code:**
1. User: "Add error handling to the Button component"
2. You: "Let me read the current Button component first..."
3. Call `get_project_files` to read the file
4. Analyze the existing code
5. Call `create_or_update_file` with updated code including error handling
6. Confirm completion to the user
```

## Step 3: Pass Project ID to Agent

You need to pass the `projectId` to the agent. Two options:

### Option A: Via Dynamic Variable (Recommended)

When starting the conversation, set a dynamic variable:

```typescript
await conversation.startSession({
  agentId: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID!,
  connectionType: 'webrtc',
  user_id: projectId || 'anonymous',
  overrides: {
    dynamicVariables: {
      project_id: projectId || ''
    }
  }
});
```

### Option B: Include in Tool Parameter Description

In each tool configuration, update the `project_id` parameter description to:
```
The project ID. Get this from the conversation context. It's typically passed when the conversation starts.
```

Then update your system prompt to remind the agent to use the project_id from context.

## Step 4: Test the Integration

1. **Deploy your app** to get a public URL
2. **Configure the tools** in ElevenLabs dashboard with your webhook URL
3. **Start a voice conversation** from your app
4. **Say**: "Create a file called hello.js with console.log('Hello World')"
5. **Check**: The file should appear in your project automatically

## Step 5: Enable Code Reading (Optional)

To let the agent see existing code before modifying:

1. Add the `get_project_files` tool (Step 1, Tool 4)
2. Update system prompt to instruct the agent to check existing files first
3. The tool will return file paths and content, which the agent can use

## Current Status

**Text Chat**: Working - Code actions parsed from AI responses  
**File Management**: Working - Files saved to Appwrite  
**Realtime Updates**: Working - SSE broadcasts changes  
**Voice Connection**: Working - ElevenLabs React SDK integrated  
⏳ **Voice Code Generation**: Needs tool configuration in ElevenLabs dashboard

## Troubleshooting

### Agent doesn't call tools
- Check tool descriptions are clear
- Ensure system prompt instructs tool usage
- Use GPT-4o or Claude 3.5 Sonnet (better tool calling)

### Files not appearing
- Check webhook URL is correct
- Verify project_id is passed correctly
- Check browser console for SSE errors
- Check server logs for webhook errors

### Agent can't see existing code
- Add `get_project_files` tool
- Update system prompt to read files before modifying
- Ensure project_id is accessible

## Example Voice Conversations

**User**: "Create a React component called Button"  
**Agent**: [Calls create_or_update_file tool] File created

**User**: "Update the Button component to add a disabled state"  
**Agent**: [Calls get_project_files] → [Calls create_or_update_file with updated code] File updated

**User**: "Delete the old test file"  
**Agent**: [Calls delete_file] File deleted

