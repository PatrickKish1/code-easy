import { NextRequest, NextResponse } from "next/server";
import { getAppwriteClient } from "@/lib/appwrite";
import { broadcast } from "@/lib/realtime";
import { aiService } from "@/lib/ai-service";

type CodeGenerationWebhookBody = {
  user_request: string; // The task/request from the user
  project_id: string; // The Appwrite project ID
  user_id?: string; // Optional user ID
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_request, project_id, user_id } = body as CodeGenerationWebhookBody;
    
    if (!user_request || !project_id) {
      return NextResponse.json({ 
        error: "user_request and project_id are required",
        received: body 
      }, { status: 400 });
    }

    console.log(`[Code Generation Webhook] Processing request for project ${project_id}:`, user_request);

    // Step 1: Get all project files from Appwrite
    const { databases, config } = getAppwriteClient();
    const filesList = await databases.listDocuments(config.databaseId, config.filesCollectionId, [] as any);
    const allFiles = (filesList.documents || [])
      .filter((d: any) => d.projectId === project_id && !d.isFolder)
      .map((d: any) => ({
        path: d.path as string,
        content: (d.content || "") as string,
      }));

    console.log(`[Code Generation Webhook] Found ${allFiles.length} files in project`);

    // Step 2: Use AI to analyze the request and determine relevant files
    // Create a prompt that asks the AI to:
    // 1. Analyze the user's request
    // 2. Identify which files are relevant
    // 3. Formulate a plan for changes
    // 4. Generate code for those files
    
    // Build context-aware prompt with relevant file analysis
    const fileListSummary = allFiles.length > 0 
      ? allFiles.map((f: any) => `${f.path} (${f.content.length} chars)`).join('\n- ')
      : 'No files yet (new project)';

    // Include file contents - limit total size to avoid token limits
    // For projects with many files, include full content of small files and snippets of large ones
    // For smaller projects, include full content
    const maxTotalChars = 15000; // Rough limit for file contents
    let currentChars = 0;
    const fileContents: string[] = [];
    
    // Sort files by size (smaller first) to include more complete files
    const sortedFiles = [...allFiles].sort((a, b) => a.content.length - b.content.length);
    
    for (const f of sortedFiles) {
      if (currentChars >= maxTotalChars) break;
      
      const remaining = maxTotalChars - currentChars;
      let content = f.content;
      
      // If file is larger than remaining space, truncate
      if (content.length > remaining) {
        content = content.substring(0, remaining - 100) + '\n... [truncated - file too large]';
      }
      
      fileContents.push(`\n=== ${f.path} ===\n${content}`);
      currentChars += content.length;
    }
    
    const fileContentsStr = fileContents.join('\n');
    
    // If we had to skip files, mention it
    const filesIncluded = fileContents.length;
    const filesSkipped = allFiles.length - filesIncluded;

    const analysisPrompt = `You are VibeCoder AI Coding Assistant. Analyze the user's request and intelligently determine which files need to be created, updated, or deleted.

User Request: "${user_request}"

Project Context:
- Total files: ${allFiles.length}
- Files in project:
${fileListSummary ? '- ' + fileListSummary : '- None'}
${filesSkipped > 0 ? `\nNote: Showing ${filesIncluded} files (${filesSkipped} files skipped due to size limits). Focus on the files shown, but you can reference other files by path if needed.` : ''}

${allFiles.length > 0 ? `\nRelevant File Contents:\n${fileContentsStr}` : ''}

Your task:
1. **Acknowledge** the user's request and confirm your understanding
2. **Analyze** which files are relevant to this task:
   - Consider file paths, imports, and dependencies
   - Identify files that need changes or new files to create
3. **Plan** what changes need to be made:
   - List the files that will be modified
   - Explain what changes will be made to each file
4. **Generate** complete, working code for each file

Important Guidelines:
- Only modify files that are ACTUALLY relevant to the user's request
- When updating a file, include ALL existing content plus your changes (merge, don't replace)
- If creating a new file, ensure it's complete and functional
- If you need to update imports/dependencies, include those changes
- Provide complete, production-ready code - not snippets or TODOs

Response Format:
Start with an acknowledgment and plan, then use action blocks:

\`\`\`action
TYPE: create|update|delete
PATH: path/to/file.ext
DESCRIPTION: Brief description of what this change does
\`\`\`

\`\`\`language
[Complete file content - full working code]
\`\`\`

Remember: Always provide the ENTIRE file content, not partial code.`;

    // Step 3: Call the AI service to generate code
    const aiResponse = await aiService.generateCode({
      threadId: `elevenlabs-${project_id}-${Date.now()}`, // Unique thread for this request
      prompt: analysisPrompt,
      context: {
        appwriteProjectId: project_id,
        projectFiles: allFiles,
      },
    });

    console.log(`[Code Generation Webhook] AI generated ${aiResponse.codeActions?.length || 0} code actions`);

    // Step 4: Apply the generated code actions to Appwrite
    const results = [];
    if (aiResponse.codeActions && aiResponse.codeActions.length > 0) {
      for (const action of aiResponse.codeActions) {
        try {
          await processCodeAction(project_id, action, databases, config, allFiles);
          results.push({
            success: true,
            action: action.type,
            path: action.path,
            description: action.description,
          });
        } catch (error: any) {
          console.error(`[Code Generation Webhook] Failed to process action for ${action.path}:`, error);
          results.push({
            success: false,
            action: action.type,
            path: action.path,
            error: error.message || String(error),
          });
        }
      }
    }

    // Step 5: Return response to ElevenLabs
    // Format the response in a way the agent can read and communicate to the user
    const successfulResults = results.filter(r => r.success);
    const failedResults = results.filter(r => !r.success);
    
    let responseMessage = "";
    
    if (successfulResults.length > 0) {
      responseMessage = `Successfully completed the code generation task!\n\n`;
      responseMessage += `I've ${successfulResults.some(r => r.action === 'create') ? 'created or ' : ''}modified the following file${successfulResults.length > 1 ? 's' : ''}:\n`;
      successfulResults.forEach((result, idx) => {
        responseMessage += `${idx + 1}. ${result.path} (${result.action})\n`;
        if (result.description) {
          responseMessage += `   └─ ${result.description}\n`;
        }
      });
      responseMessage += `\nAll changes have been applied and saved to your project. You can see them in your code editor now.`;
    } else {
      responseMessage = ` I encountered issues while trying to generate the code.`;
    }
    
    if (failedResults.length > 0) {
      responseMessage += `\n\n Some operations failed:\n`;
      failedResults.forEach((result, idx) => {
        responseMessage += `${idx + 1}. ${result.path}: ${result.error || 'Unknown error'}\n`;
      });
    }

    // Return structured response that agent can use
    return NextResponse.json({
      success: successfulResults.length > 0,
      message: responseMessage,
      summary: {
        total_files: results.length,
        successful: successfulResults.length,
        failed: failedResults.length,
      },
      files_modified: successfulResults.map(r => r.path),
      details: results,
      // Include the AI's original message for context
      ai_message: aiResponse.message || "Code generation completed",
    });

  } catch (error: any) {
    console.error("[Code Generation Webhook] Error:", error);
    return NextResponse.json({ 
      success: false,
      message: ` I encountered an error while processing your request: ${error.message || String(error)}. Please try rephrasing your request or break it into smaller steps.`,
      error: "Failed to generate code",
      details: error.message || String(error),
    }, { status: 500 });
  }
}

async function processCodeAction(
  projectId: string,
  action: {
    type: "create" | "update" | "delete";
    path: string;
    content?: string;
    description: string;
  },
  databases: any,
  config: any,
  allFiles?: Array<{ path: string; content: string }>
) {
  const list = await databases.listDocuments(config.databaseId, config.filesCollectionId, [] as any);
  const docs = list.documents || [];

  switch (action.type) {
    case "delete": {
      const doc = docs.find((d: any) => d.projectId === projectId && d.path === action.path);
      if (doc) {
        await databases.deleteDocument(config.databaseId, config.filesCollectionId, doc.$id);
        broadcast("file:deleted", { projectId, path: action.path });
      }
      break;
    }
    case "create":
    case "update": {
      const existing = docs.find((d: any) => d.projectId === projectId && d.path === action.path);
      let finalContent = action.content ?? "";
      
      // For updates: If file exists, we need to merge properly
      // The AI should provide full merged content, but if content seems incomplete,
      // we try to get the full original from Appwrite and merge if needed
      if (action.type === "update" && existing) {
        const existingDoc = docs.find((d: any) => d.$id === existing.$id);
        const originalContent = existingDoc?.content || "";
        
        // If AI-provided content is significantly shorter, it might be a patch
        // For now, we trust the AI provides full merged content as instructed
        // But log if it seems incomplete
        if (originalContent && finalContent.length < originalContent.length * 0.7) {
          console.warn(`[Code Generation] Update for ${action.path}: Provided content (${finalContent.length} chars) is much shorter than original (${originalContent.length} chars). AI should provide full merged content.`);
          // Still apply it - the AI might have significantly simplified the code
        }
        
        // Note: We're trusting the AI to provide full merged content as per the prompt instructions
        // If needed later, we could implement diff/patch merging here
      }
      
      const payload: any = {
        path: action.path,
        content: finalContent,
        projectId,
      };
      
      if (existing) {
        const updated = await databases.updateDocument(
          config.databaseId,
          config.filesCollectionId,
          existing.$id,
          payload
        );
        broadcast("file:updated", {
          projectId,
          path: updated.path,
          content: updated.content ?? "",
          isFolder: false,
        });
      } else {
        const created = await databases.createDocument(
          config.databaseId,
          config.filesCollectionId,
          "unique()",
          payload
        );
        broadcast("file:created", {
          projectId,
          path: created.path,
          content: created.content ?? "",
          isFolder: false,
        });
      }
      break;
    }
  }
}

