import { NextRequest, NextResponse } from "next/server";

/**
 * Converts dashboard format to API format
 */
function convertToolConfig(dashboardConfig: any): any {
  const apiConfig = { ...dashboardConfig };

  // Fix force_pre_tool_speech: "auto" -> false (boolean)
  if (apiConfig.force_pre_tool_speech === "auto") {
    apiConfig.force_pre_tool_speech = false;
  }

  // Client tools don't have api_schema - they have parameters object (not array!)
  // Only process api_schema transformations for webhook tools
  if (apiConfig.type === "client") {
    // Convert parameters array to object format (similar to body schema properties)
    if (Array.isArray(apiConfig.parameters)) {
      const parametersObj: Record<string, any> = {};
      const required: string[] = [];

      apiConfig.parameters.forEach((param: any) => {
        const key = param.identifier || param.name;
        if (key) {
          const paramObj: any = {
            type: param.data_type || param.type,
          };

          // Add description if present
          if (param.description) {
            paramObj.description = param.description;
          }

          parametersObj[key] = paramObj;

          // Collect required fields
          if (param.required) {
            required.push(key);
          }
        }
      });

      // Convert to object with properties and required array
      apiConfig.parameters = {
        properties: parametersObj,
        ...(required.length > 0 && { required }),
      };
    }
    // The expects_response field is already correct (expects_response, not expectsResponse)
    return apiConfig;
  }

  if (apiConfig.api_schema) {
    // Fix path_params_schema: [] -> {} (empty object)
    if (Array.isArray(apiConfig.api_schema.path_params_schema)) {
      apiConfig.api_schema.path_params_schema = {};
    }

    // Fix request_headers: [] -> {} (empty object)
    if (Array.isArray(apiConfig.api_schema.request_headers)) {
      apiConfig.api_schema.request_headers = {};
    }

    // Fix query_params_schema: [] -> null, or convert array to proper format
    if (Array.isArray(apiConfig.api_schema.query_params_schema)) {
      if (apiConfig.api_schema.query_params_schema.length === 0) {
        apiConfig.api_schema.query_params_schema = null;
      } else {
        // Convert array format to QueryParamsJsonSchema format
        const properties: Record<string, any> = {};
        const required: string[] = [];

        apiConfig.api_schema.query_params_schema.forEach((param: any) => {
          const key = param.id || param.name;
          if (key) {
            const apiProp: any = {
              type: param.type,
            };

            // Can only set one of: description, dynamic_variable, is_system_provided, or constant_value
            if (param.constant_value && param.constant_value !== "") {
              apiProp.constant_value = param.constant_value;
              // Don't include description when constant_value is set
            } else if (param.dynamic_variable && param.dynamic_variable !== "") {
              apiProp.dynamic_variable = param.dynamic_variable;
              // Don't include description when dynamic_variable is set
            } else if (param.description) {
              // Only include description if neither constant_value nor dynamic_variable is set
              apiProp.description = param.description;
            }

            properties[key] = apiProp;

            // Collect required fields
            if (param.required) {
              required.push(key);
            }
          }
        });

        apiConfig.api_schema.query_params_schema = {
          properties,
          ...(required.length > 0 && { required }),
        };
      }
    }

    // Fix request_body_schema
    if (apiConfig.api_schema.request_body_schema) {
      const bodySchema = apiConfig.api_schema.request_body_schema;

      // Remove extra fields not allowed by API
      delete bodySchema.id;
      delete bodySchema.dynamic_variable;
      delete bodySchema.constant_value;
      delete bodySchema.value_type;

      // Fix properties: array -> object
      if (Array.isArray(bodySchema.properties)) {
        const properties: Record<string, any> = {};
        const required: string[] = [];

        bodySchema.properties.forEach((prop: any) => {
          const key = prop.id || prop.name;
          if (key) {
            // Build the property object
            const apiProp: any = {
              type: prop.type,
            };

            // Can only set one of: description, dynamic_variable, is_system_provided, or constant_value
            if (prop.constant_value && prop.constant_value !== "") {
              apiProp.constant_value = prop.constant_value;
              // Don't include description when constant_value is set
            } else if (prop.dynamic_variable && prop.dynamic_variable !== "") {
              apiProp.dynamic_variable = prop.dynamic_variable;
              // Don't include description when dynamic_variable is set
            } else if (prop.description) {
              // Only include description if neither constant_value nor dynamic_variable is set
              apiProp.description = prop.description;
            }

            properties[key] = apiProp;

            // Collect required fields
            if (prop.required) {
              required.push(key);
            }
          }
        });

        bodySchema.properties = properties;
        bodySchema.required = required;
      }

      // Fix required: boolean -> array
      if (typeof bodySchema.required === "boolean") {
        if (!bodySchema.required) {
          bodySchema.required = [];
        } else {
          // If true but properties already converted, required array should be set above
          // Otherwise, we need to derive it from properties
          if (!Array.isArray(bodySchema.required) && bodySchema.properties) {
            bodySchema.required = Object.keys(bodySchema.properties);
          }
        }
      }
    }
  }

  return apiConfig;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { toolConfig, apiKey } = body;

    if (!toolConfig) {
      return NextResponse.json({ error: "toolConfig is required" }, { status: 400 });
    }

    if (!apiKey) {
      return NextResponse.json({ error: "API key is required" }, { status: 400 });
    }

    // Convert dashboard format to API format
    const apiToolConfig = convertToolConfig(toolConfig);

    const response = await fetch("https://api.elevenlabs.io/v1/convai/tools", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        tool_config: apiToolConfig,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { 
          error: "Failed to create tool", 
          details: data,
          status: response.status,
          // Include converted config for debugging
          debug: {
            convertedConfig: apiToolConfig,
          }
        },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error creating tool:", error);
    return NextResponse.json(
      { error: "Failed to create tool", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
