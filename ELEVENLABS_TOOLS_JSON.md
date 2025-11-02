# ElevenLabs Tools JSON Configurations

These are the corrected JSON configurations for all four tools. Replace `https://code-easy-gamma.vercel.app` with your actual deployed domain.

## Tool 1: Create/Update File

```json
{
  "tool_config": {
    "type": "webhook",
    "name": "create_or_update_file",
    "description": "Create a new file or update an existing file in the project. Use this when the user wants to generate new code or modify existing code. Always provide complete, working code in the file_content parameter.",
    "api_schema": {
      "url": "https://code-easy-gamma.vercel.app/api/webhooks/elevenlabs",
      "method": "POST",
      "path_params_schema": {},
      "query_params_schema": null,
      "request_body_schema": {
        "type": "object",
        "properties": {
          "action_type": {
            "type": "string",
            "description": "The action to perform. Must be either 'create' or 'update'."
          },
          "file_path": {
            "type": "string",
            "description": "The file path relative to project root (e.g., 'src/components/Button.tsx', 'utils/helpers.js'). Always include the full path with file extension."
          },
          "file_content": {
            "type": "string",
            "description": "The complete file content including all code, imports, and comments. This must be the full, working code - not a snippet or partial code."
          },
          "project_id": {
            "type": "string",
            "description": "The Appwrite project ID. Use the value from the conversation context or userId."
          },
          "description": {
            "type": "string",
            "description": "Brief description of what the code does (optional)"
          }
        },
        "required": ["action_type", "file_path", "file_content", "project_id"]
      },
      "request_headers": {},
      "auth_connection": null
    },
    "response_timeout_secs": 30,
    "assignments": [],
    "disable_interruptions": false,
    "force_pre_tool_speech": false,
    "tool_call_sound": null,
    "tool_call_sound_behavior": "auto",
    "execution_mode": "immediate",
    "dynamic_variables": {
      "dynamic_variable_placeholders": {}
    }
  }
}
```

## Tool 2: Delete File

```json
{
  "tool_config": {
    "type": "webhook",
    "name": "delete_file",
    "description": "Delete a file or folder from the project. Use this when the user wants to remove a file or clean up the project structure.",
    "api_schema": {
      "url": "https://code-easy-gamma.vercel.app/api/webhooks/elevenlabs",
      "method": "POST",
      "path_params_schema": {},
      "query_params_schema": null,
      "request_body_schema": {
        "type": "object",
        "properties": {
          "action_type": {
            "type": "string",
            "constant_value": "delete",
            "description": "The action type, always 'delete' for this tool"
          },
          "file_path": {
            "type": "string",
            "description": "The file or folder path to delete (e.g., 'src/components/Button.tsx' or 'src/utils/'). If deleting a folder, set is_folder to true."
          },
          "project_id": {
            "type": "string",
            "description": "The Appwrite project ID. Use the value from the conversation context or userId."
          },
          "is_folder": {
            "type": "boolean",
            "description": "Set to true if deleting a folder, false if deleting a file. Defaults to false.",
            "constant_value": false
          }
        },
        "required": ["action_type", "file_path", "project_id"]
      },
      "request_headers": {},
      "auth_connection": null
    },
    "response_timeout_secs": 20,
    "assignments": [],
    "disable_interruptions": false,
    "force_pre_tool_speech": false,
    "tool_call_sound": null,
    "tool_call_sound_behavior": "auto",
    "execution_mode": "immediate",
    "dynamic_variables": {
      "dynamic_variable_placeholders": {}
    }
  }
}
```

## Tool 3: Rename File

```json
{
  "tool_config": {
    "type": "webhook",
    "name": "rename_file",
    "description": "Rename a file or folder in the project. Use this when the user wants to change a file name or reorganize the project structure.",
    "api_schema": {
      "url": "https://code-easy-gamma.vercel.app/api/webhooks/elevenlabs",
      "method": "POST",
      "path_params_schema": {},
      "query_params_schema": null,
      "request_body_schema": {
        "type": "object",
        "properties": {
          "action_type": {
            "type": "string",
            "constant_value": "rename",
            "description": "The action type, always 'rename' for this tool"
          },
          "file_path": {
            "type": "string",
            "description": "The current file or folder path (e.g., 'src/components/OldButton.tsx')"
          },
          "new_path": {
            "type": "string",
            "description": "The new file or folder path (e.g., 'src/components/NewButton.tsx'). Must include the full path with file extension."
          },
          "project_id": {
            "type": "string",
            "description": "The Appwrite project ID. Use the value from the conversation context or userId."
          }
        },
        "required": ["action_type", "file_path", "new_path", "project_id"]
      },
      "request_headers": {},
      "auth_connection": null
    },
    "response_timeout_secs": 20,
    "assignments": [],
    "disable_interruptions": false,
    "force_pre_tool_speech": false,
    "tool_call_sound": null,
    "tool_call_sound_behavior": "auto",
    "execution_mode": "immediate",
    "dynamic_variables": {
      "dynamic_variable_placeholders": {}
    }
  }
}
```

## Tool 4: Get Project Files

```json
{
  "tool_config": {
    "type": "webhook",
    "name": "get_project_files",
    "description": "Get a list of all files in the project or read a specific file's content. Use this to understand the existing codebase before making changes. Always check existing files before modifying them.",
    "api_schema": {
      "url": "https://code-easy-gamma.vercel.app/api/files",
      "method": "GET",
      "path_params_schema": {},
      "query_params_schema": {
        "properties": {
          "projectId": {
            "type": "string",
            "constant_value": "68c9f40a002d5afe6b43",
            "description": "The Appwrite project ID"
          },
          "path": {
            "type": "string",
            "description": "Optional: Specific file path to read. If omitted, returns all files in the project."
          }
        },
        "required": ["projectId"]
      },
      "request_body_schema": null,
      "request_headers": {},
      "auth_connection": null
    },
    "response_timeout_secs": 20,
    "assignments": [],
    "disable_interruptions": false,
    "force_pre_tool_speech": false,
    "tool_call_sound": null,
    "tool_call_sound_behavior": "auto",
    "execution_mode": "immediate",
    "dynamic_variables": {
      "dynamic_variable_placeholders": {}
    }
  }
}
```

## Important Notes

### URL Correction
- **Wrong**: `https://code-easy-gamma.vercel.app/webhooks/elevenlabs`
- **Correct**: `https://code-easy-gamma.vercel.app/api/webhooks/elevenlabs`

### Project ID Options

You have two ways to handle `project_id`:

#### Option 1: Use Dynamic Variable (Recommended if supported)
In the `project_id` property, use:
```json
"project_id": {
  "type": "string",
  "dynamic_variable": {
    "variable_name": "project_id"
  },
  "description": "The Appwrite project ID from conversation context"
}
```

#### Option 2: Use Constant Value (Current setup)
Keep the constant value but update it in each tool:
```json
"project_id": {
  "type": "string",
  "constant_value": "68c9f40a002d5afe6b43",
  "description": "The Appwrite project ID"
}
```

### How to Use These JSONs

1. **Via API**: Use the ElevenLabs API to create tools:
   ```bash
   curl -X POST https://api.elevenlabs.io/v1/convai/tools \
     -H "xi-api-key: YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -d @tool1_create_update.json
   ```

2. **Via Dashboard**: Copy each JSON (just the `tool_config` object) and paste it when creating tools in the dashboard, or use the API reference.

### Testing

After creating the tools, add them to your agent's tool list in the dashboard, then test:

1. **Start a voice conversation** from your app
2. **Say**: "Create a file called hello.js with console.log('Hello World')"
3. **Check**: The file should appear in your project automatically via SSE

The system prompt section is documented in `ELEVENLABS_SETUP.md` - add the tool usage guidelines to your existing CodeBot prompt.

