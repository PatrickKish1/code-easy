Installation
Supported Environments
LangChain is written in TypeScript and can be used in:

Node.js (ESM and CommonJS) - 18.x, 19.x, 20.x
Cloudflare Workers
Vercel / Next.js (Browser, Serverless and Edge functions)
Supabase Edge Functions
Browser
Deno
Bun
However, note that individual integrations may not be supported in all environments.

Installation
To install the main langchain package, run:

npm
Yarn
pnpm
pnpm add langchain @langchain/core

While this package acts as a sane starting point to using LangChain, much of the value of LangChain comes when integrating it with various model providers, datastores, etc. By default, the dependencies needed to do that are NOT installed. You will need to install the dependencies for specific integrations separately. We'll show how to do that in the next sections of this guide.

Please also see the section on installing integration packages for some special considerations when installing LangChain packages.

Ecosystem packages
With the exception of the langsmith SDK, all packages in the LangChain ecosystem depend on @langchain/core, which contains base classes and abstractions that other packages use. The dependency graph below shows how the different packages are related. A directed arrow indicates that the source package depends on the target package:



Note: It is important that your app only uses one version of @langchain/core. Common package managers may introduce additional versions when resolving direct dependencies, even if you don't intend this. See this section on installing integration packages for more information and ways to remedy this.

@langchain/community
The @langchain/community package contains a range of third-party integrations. Install with:

npm
Yarn
pnpm
pnpm add @langchain/community @langchain/core

There are also more granular packages containing LangChain integrations for individual providers.

@langchain/core
The @langchain/core package contains base abstractions that the rest of the LangChain ecosystem uses, along with the LangChain Expression Language. It should be installed separately:

npm
Yarn
pnpm
pnpm add @langchain/core

LangGraph
LangGraph.js is a library for building stateful, multi-actor applications with LLMs. It integrates smoothly with LangChain, but can be used without it.

Install with:

npm
Yarn
pnpm
pnpm add @langchain/langgraph @langchain/core

LangSmith SDK
The LangSmith SDK is automatically installed by LangChain. If you're not using it with LangChain, install with:

npm
Yarn
pnpm
pnpm add langsmith

tip
See this section for general instructions on installing integration packages.

Installing integration packages
LangChain supports packages that contain module integrations with individual third-party providers. They can be as specific as @langchain/anthropic, which contains integrations just for Anthropic models, or as broad as @langchain/community, which contains broader variety of community contributed integrations.

These packages, as well as the main LangChain package, all have @langchain/core as a peer dependency to avoid package managers installing multiple versions of the same package. It contains the base abstractions that these integration packages extend.

To ensure that all integrations and their types interact with each other properly, it is important that they all use the same version of @langchain/core. If you encounter type errors around base classes, you may need to guarantee that your package manager is resolving a single version of @langchain/core. To do so, you can add a "resolutions" or "overrides" field like the following in your project's package.json. The name will depend on your package manager:

tip
The resolutions or pnpm.overrides fields for yarn or pnpm must be set in the root package.json file.

If you are using yarn:

yarn package.json
{
  "name": "your-project",
  "version": "0.0.0",
  "private": true,
  "engines": {
    "node": ">=18"
  },
  "dependencies": {
    "@langchain/anthropic": "^0.0.2",
    "@langchain/core": "^0.3.0",
    "langchain": "0.0.207"
  },
  "resolutions": {
    "@langchain/core": "0.3.0"
  }
}

You can also try running the yarn dedupe command if you are on yarn version 2 or higher.

Or for npm:

npm package.json
{
  "name": "your-project",
  "version": "0.0.0",
  "private": true,
  "engines": {
    "node": ">=18"
  },
  "dependencies": {
    "@langchain/anthropic": "^0.0.2",
    "@langchain/core": "^0.3.0",
    "langchain": "0.0.207"
  },
  "overrides": {
    "@langchain/core": "0.3.0"
  }
}

You can also try the npm dedupe command.

Or for pnpm:

pnpm package.json
{
  "name": "your-project",
  "version": "0.0.0",
  "private": true,
  "engines": {
    "node": ">=18"
  },
  "dependencies": {
    "@langchain/anthropic": "^0.0.2",
    "@langchain/core": "^0.3.0",
    "langchain": "0.0.207"
  },
  "pnpm": {
    "overrides": {
      "@langchain/core": "0.3.0"
    }
  }
}

You can also try the pnpm dedupe command.

Loading the library
TypeScript
LangChain is written in TypeScript and provides type definitions for all of its public APIs.

ESM
LangChain provides an ESM build targeting Node.js environments. You can import it using the following syntax:

npm
Yarn
pnpm
pnpm add @langchain/openai @langchain/core

import { ChatOpenAI } from "@langchain/openai";

If you are using TypeScript in an ESM project we suggest updating your tsconfig.json to include the following:

tsconfig.json
{
  "compilerOptions": {
    ...
    "target": "ES2020", // or higher
    "module": "nodenext",
  }
}

CommonJS
LangChain provides a CommonJS build targeting Node.js environments. You can import it using the following syntax:

const { ChatOpenAI } = require("@langchain/openai");

Cloudflare Workers
LangChain can be used in Cloudflare Workers. You can import it using the following syntax:

import { ChatOpenAI } from "@langchain/openai";

Vercel / Next.js
LangChain can be used in Vercel / Next.js. We support using LangChain in frontend components, in Serverless functions and in Edge functions. You can import it using the following syntax:

import { ChatOpenAI } from "@langchain/openai";

Deno / Supabase Edge Functions
LangChain can be used in Deno / Supabase Edge Functions. You can import it using the following syntax:

import { ChatOpenAI } from "https://esm.sh/@langchain/openai";

or

import { ChatOpenAI } from "npm:@langchain/openai";

Browser
LangChain can be used in the browser. In our CI we test bundling LangChain with Webpack and Vite, but other bundlers should work too. You can import it using the following syntax:

import { ChatOpenAI } from "@langchain/openai";

Unsupported: Node.js 16
We do not support Node.js 16, but if you still want to run LangChain on Node.js 16, you will need to follow the instructions in this section. We do not guarantee that these instructions will continue to work in the future.

You will have to make fetch available globally, either:

run your application with NODE_OPTIONS='--experimental-fetch' node ..., or
install node-fetch and follow the instructions here
You'll also need to polyfill ReadableStream by installing:

npm
Yarn
pnpm
pnpm add web-streams-polyfill@4

And then adding it to the global namespace in your main entrypoint:

import "web-streams-polyfill/polyfill";

Additionally you'll have to polyfill structuredClone, eg. by installing core-js and following the instructions here.

If you are running Node.js 18+, you do not need to do anything.



Conceptual guide
This guide provides explanations of the key concepts behind the LangChain framework and AI applications more broadly.

We recommend that you go through at least one of the Tutorials before diving into the conceptual guide. This will provide practical context that will make it easier to understand the concepts discussed here.

The conceptual guide does not cover step-by-step instructions or specific implementation examples — those are found in the How-to guides and Tutorials. For detailed reference material, please see the API reference.

High level
Why LangChain?: Overview of the value that LangChain provides.
Architecture: How packages are organized in the LangChain ecosystem.
Concepts
Chat models: LLMs exposed via a chat API that process sequences of messages as input and output a message.
Messages: The unit of communication in chat models, used to represent model input and output.
Chat history: A conversation represented as a sequence of messages, alternating between user messages and model responses.
Tools: A function with an associated schema defining the function's name, description, and the arguments it accepts.
Tool calling: A type of chat model API that accepts tool schemas, along with messages, as input and returns invocations of those tools as part of the output message.
Structured output: A technique to make a chat model respond in a structured format, such as JSON that matches a given schema.
Memory: Information about a conversation that is persisted so that it can be used in future conversations.
Multimodality: The ability to work with data that comes in different forms, such as text, audio, images, and video.
Runnable interface: The base abstraction that many LangChain components and the LangChain Expression Language are built on.
Streaming: LangChain streaming APIs for surfacing results as they are generated.
LangChain Expression Language (LCEL): A syntax for orchestrating LangChain components. Most useful for simpler applications.
Document loaders: Load a source as a list of documents.
Retrieval: Information retrieval systems can retrieve structured or unstructured data from a datasource in response to a query.
Text splitters: Split long text into smaller chunks that can be individually indexed to enable granular retrieval.
Embedding models: Models that represent data such as text or images in a vector space.
Vector stores: Storage of and efficient search over vectors and associated metadata.
Retriever: A component that returns relevant documents from a knowledge base in response to a query.
Retrieval Augmented Generation (RAG): A technique that enhances language models by combining them with external knowledge bases.
Agents: Use a language model to choose a sequence of actions to take. Agents can interact with external resources via tool.
Prompt templates: Component for factoring out the static parts of a model "prompt" (usually a sequence of messages). Useful for serializing, versioning, and reusing these static parts.
Output parsers: Responsible for taking the output of a model and transforming it into a more suitable format for downstream tasks. Output parsers were primarily useful prior to the general availability of tool calling and structured outputs.
Few-shot prompting: A technique for improving model performance by providing a few examples of the task to perform in the prompt.
Example selectors: Used to select the most relevant examples from a dataset based on a given input. Example selectors are used in few-shot prompting to select examples for a prompt.
Callbacks: Callbacks enable the execution of custom auxiliary code in built-in components. Callbacks are used to stream outputs from LLMs in LangChain, trace the intermediate steps of an application, and more.
Tracing: The process of recording the steps that an application takes to go from input to output. Tracing is essential for debugging and diagnosing issues in complex applications.
Evaluation: The process of assessing the performance and effectiveness of AI applications. This involves testing the model's responses against a set of predefined criteria or benchmarks to ensure it meets the desired quality standards and fulfills the intended purpose. This process is vital for building reliable applications.
Glossary
AIMessageChunk: A partial response from an AI message. Used when streaming responses from a chat model.
AIMessage: Represents a complete response from an AI model.
StructuredTool: The base class for all tools in LangChain.
batch: Use to execute a runnable with batch inputs a Runnable.
bindTools: Allows models to interact with tools.
Caching: Storing results to avoid redundant calls to a chat model.
Context window: The maximum size of input a chat model can process.
Conversation patterns: Common patterns in chat interactions.
Document: LangChain's representation of a document.
Embedding models: Models that generate vector embeddings for various data types.
HumanMessage: Represents a message from a human user.
input and output types: Types used for input and output in Runnables.
Integration packages: Third-party packages that integrate with LangChain.
invoke: A standard method to invoke a Runnable.
JSON mode: Returning responses in JSON format.
@langchain/community: Community-driven components for LangChain.
@langchain/core: Core langchain package. Includes base interfaces and in-memory implementations.
langchain: A package for higher level components (e.g., some pre-built chains).
@langchain/langgraph: Powerful orchestration layer for LangChain. Use to build complex pipelines and workflows.
Managing chat history: Techniques to maintain and manage the chat history.
OpenAI format: OpenAI's message format for chat models.
Propagation of RunnableConfig: Propagating configuration through Runnables.
RemoveMessage: An abstraction used to remove a message from chat history, used primarily in LangGraph.
role: Represents the role (e.g., user, assistant) of a chat message.
RunnableConfig: Use to pass run time information to Runnables (e.g., runName, runId, tags, metadata, maxConcurrency, recursionLimit, configurable).
Standard parameters for chat models: Parameters such as API key, temperature, and maxTokens,
stream: Use to stream output from a Runnable or a graph.
Tokenization: The process of converting data into tokens and vice versa.
Tokens: The basic unit that a language model reads, processes, and generates under the hood.
Tool artifacts: Add artifacts to the output of a tool that will not be sent to the model, but will be available for downstream processing.
Tool binding: Binding tools to models.
tool: Function for creating tools in LangChain.
Toolkits: A collection of tools that can be used together.
ToolMessage: Represents a message that contains the results of a tool execution.
Vector stores: Datastores specialized for storing and efficiently searching vector embeddings.
withStructuredOutput: A helper method for chat models that natively support tool calling to get structured output matching a given schema specified via Zod, JSON schema or a function.



How to return structured data from a model
It is often useful to have a model return output that matches some specific schema. One common use-case is extracting data from arbitrary text to insert into a traditional database or use with some other downstream system. This guide will show you a few different strategies you can use to do this.

Prerequisites
This guide assumes familiarity with the following concepts:

Chat models
The .withStructuredOutput() method
There are several strategies that models can use under the hood. For some of the most popular model providers, including Anthropic, Google VertexAI, Mistral, and OpenAI LangChain implements a common interface that abstracts away these strategies called .withStructuredOutput.

By invoking this method (and passing in JSON schema or a Zod schema) the model will add whatever model parameters + output parsers are necessary to get back structured output matching the requested schema. If the model supports more than one way to do this (e.g., function calling vs JSON mode) - you can configure which method to use by passing into that method.

Let’s look at some examples of this in action! We’ll use Zod to create a simple response schema.

Pick your chat model:
OpenAI
Anthropic
Google Gemini
MistralAI
Groq
VertexAI
Install dependencies
tip
See this section for general instructions on installing integration packages.

npm
yarn
pnpm
pnpm add @langchain/groq 

Add environment variables
GROQ_API_KEY=your-api-key

Instantiate the model
import { ChatGroq } from "@langchain/groq";

const model = new ChatGroq({
  model: "llama-3.3-70b-versatile",
  temperature: 0
});

import { z } from "zod";

const joke = z.object({
  setup: z.string().describe("The setup of the joke"),
  punchline: z.string().describe("The punchline to the joke"),
  rating: z.number().optional().describe("How funny the joke is, from 1 to 10"),
});

const structuredLlm = model.withStructuredOutput(joke);

await structuredLlm.invoke("Tell me a joke about cats");

{
  setup: "Why don't cats play poker in the wild?",
  punchline: "Too many cheetahs.",
  rating: 7
}

One key point is that though we set our Zod schema as a variable named joke, Zod is not able to access that variable name, and therefore cannot pass it to the model. Though it is not required, we can pass a name for our schema in order to give the model additional context as to what our schema represents, improving performance:

const structuredLlm = model.withStructuredOutput(joke, { name: "joke" });

await structuredLlm.invoke("Tell me a joke about cats");

{
  setup: "Why don't cats play poker in the wild?",
  punchline: "Too many cheetahs!",
  rating: 7
}

The result is a JSON object.

We can also pass in an OpenAI-style JSON schema dict if you prefer not to use Zod. This object should contain three properties:

name: The name of the schema to output.
description: A high level description of the schema to output.
parameters: The nested details of the schema you want to extract, formatted as a JSON schema dict.
In this case, the response is also a dict:

const structuredLlm = model.withStructuredOutput({
  name: "joke",
  description: "Joke to tell user.",
  parameters: {
    title: "Joke",
    type: "object",
    properties: {
      setup: { type: "string", description: "The setup for the joke" },
      punchline: { type: "string", description: "The joke's punchline" },
    },
    required: ["setup", "punchline"],
  },
});

await structuredLlm.invoke("Tell me a joke about cats", { name: "joke" });

{
  setup: "Why was the cat sitting on the computer?",
  punchline: "Because it wanted to keep an eye on the mouse!"
}

If you are using JSON Schema, you can take advantage of other more complex schema descriptions to create a similar effect.

You can also use tool calling directly to allow the model to choose between options, if your chosen model supports it. This involves a bit more parsing and setup. See this how-to guide for more details.

Specifying the output method (Advanced)
For models that support more than one means of outputting data, you can specify the preferred one like this:

const structuredLlm = model.withStructuredOutput(joke, {
  method: "json_mode",
  name: "joke",
});

await structuredLlm.invoke(
  "Tell me a joke about cats, respond in JSON with `setup` and `punchline` keys"
);

{
  setup: "Why don't cats play poker in the jungle?",
  punchline: "Too many cheetahs!"
}

In the above example, we use OpenAI’s alternate JSON mode capability along with a more specific prompt.

For specifics about the model you choose, peruse its entry in the API reference pages.

(Advanced) Raw outputs
LLMs aren’t perfect at generating structured output, especially as schemas become complex. You can avoid raising exceptions and handle the raw output yourself by passing includeRaw: true. This changes the output format to contain the raw message output and the parsed value (if successful):

const joke = z.object({
  setup: z.string().describe("The setup of the joke"),
  punchline: z.string().describe("The punchline to the joke"),
  rating: z.number().optional().describe("How funny the joke is, from 1 to 10"),
});

const structuredLlm = model.withStructuredOutput(joke, {
  includeRaw: true,
  name: "joke",
});

await structuredLlm.invoke("Tell me a joke about cats");

{
  raw: AIMessage {
    lc_serializable: true,
    lc_kwargs: {
      content: "",
      tool_calls: [
        {
          name: "joke",
          args: [Object],
          id: "call_0pEdltlfSXjq20RaBFKSQOeF"
        }
      ],
      invalid_tool_calls: [],
      additional_kwargs: { function_call: undefined, tool_calls: [ [Object] ] },
      response_metadata: {}
    },
    lc_namespace: [ "langchain_core", "messages" ],
    content: "",
    name: undefined,
    additional_kwargs: {
      function_call: undefined,
      tool_calls: [
        {
          id: "call_0pEdltlfSXjq20RaBFKSQOeF",
          type: "function",
          function: [Object]
        }
      ]
    },
    response_metadata: {
      tokenUsage: { completionTokens: 33, promptTokens: 88, totalTokens: 121 },
      finish_reason: "stop"
    },
    tool_calls: [
      {
        name: "joke",
        args: {
          setup: "Why was the cat sitting on the computer?",
          punchline: "Because it wanted to keep an eye on the mouse!",
          rating: 7
        },
        id: "call_0pEdltlfSXjq20RaBFKSQOeF"
      }
    ],
    invalid_tool_calls: [],
    usage_metadata: { input_tokens: 88, output_tokens: 33, total_tokens: 121 }
  },
  parsed: {
    setup: "Why was the cat sitting on the computer?",
    punchline: "Because it wanted to keep an eye on the mouse!",
    rating: 7
  }
}

Prompting techniques
You can also prompt models to outputting information in a given format. This approach relies on designing good prompts and then parsing the output of the models. This is the only option for models that don’t support .with_structured_output() or other built-in approaches.

Using JsonOutputParser
The following example uses the built-in JsonOutputParser to parse the output of a chat model prompted to match a the given JSON schema. Note that we are adding format_instructions directly to the prompt from a method on the parser:

import { JsonOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";

type Person = {
  name: string;
  height_in_meters: number;
};

type People = {
  people: Person[];
};

const formatInstructions = `Respond only in valid JSON. The JSON object you return should match the following schema:
{{ people: [{{ name: "string", height_in_meters: "number" }}] }}

Where people is an array of objects, each with a name and height_in_meters field.
`;

// Set up a parser
const parser = new JsonOutputParser<People>();

// Prompt
const prompt = await ChatPromptTemplate.fromMessages([
  [
    "system",
    "Answer the user query. Wrap the output in `json` tags\n{format_instructions}",
  ],
  ["human", "{query}"],
]).partial({
  format_instructions: formatInstructions,
});


Let’s take a look at what information is sent to the model:

const query = "Anna is 23 years old and she is 6 feet tall";

console.log((await prompt.format({ query })).toString());

System: Answer the user query. Wrap the output in `json` tags
Respond only in valid JSON. The JSON object you return should match the following schema:
{{ people: [{{ name: "string", height_in_meters: "number" }}] }}

Where people is an array of objects, each with a name and height_in_meters field.

Human: Anna is 23 years old and she is 6 feet tall

And now let’s invoke it:

const chain = prompt.pipe(model).pipe(parser);

await chain.invoke({ query });

{ people: [ { name: "Anna", height_in_meters: 1.83 } ] }

For a deeper dive into using output parsers with prompting techniques for structured output, see this guide.

Custom Parsing
You can also create a custom prompt and parser with LangChain Expression Language (LCEL), using a plain function to parse the output from the model:

import { AIMessage } from "@langchain/core/messages";
import { ChatPromptTemplate } from "@langchain/core/prompts";

type Person = {
  name: string;
  height_in_meters: number;
};

type People = {
  people: Person[];
};

const schema = `{{ people: [{{ name: "string", height_in_meters: "number" }}] }}`;

// Prompt
const prompt = await ChatPromptTemplate.fromMessages([
  [
    "system",
    `Answer the user query. Output your answer as JSON that
matches the given schema: \`\`\`json\n{schema}\n\`\`\`.
Make sure to wrap the answer in \`\`\`json and \`\`\` tags`,
  ],
  ["human", "{query}"],
]).partial({
  schema,
});

/**
 * Custom extractor
 *
 * Extracts JSON content from a string where
 * JSON is embedded between ```json and ``` tags.
 */
const extractJson = (output: AIMessage): Array<People> => {
  const text = output.content as string;
  // Define the regular expression pattern to match JSON blocks
  const pattern = /```json(.*?)```/gs;

  // Find all non-overlapping matches of the pattern in the string
  const matches = text.match(pattern);

  // Process each match, attempting to parse it as JSON
  try {
    return (
      matches?.map((match) => {
        // Remove the markdown code block syntax to isolate the JSON string
        const jsonStr = match.replace(/```json|```/g, "").trim();
        return JSON.parse(jsonStr);
      }) ?? []
    );
  } catch (error) {
    throw new Error(`Failed to parse: ${output}`);
  }
};

Here is the prompt sent to the model:

const query = "Anna is 23 years old and she is 6 feet tall";

console.log((await prompt.format({ query })).toString());

System: Answer the user query. Output your answer as JSON that
matches the given schema: ```json
{{ people: [{{ name: "string", height_in_meters: "number" }}] }}
```.
Make sure to wrap the answer in ```json and ``` tags
Human: Anna is 23 years old and she is 6 feet tall

And here’s what it looks like when we invoke it:

import { RunnableLambda } from "@langchain/core/runnables";

const chain = prompt
  .pipe(model)
  .pipe(new RunnableLambda({ func: extractJson }));

await chain.invoke({ query });

[
  { people: [ { name: "Anna", height_in_meters: 1.83 } ] }
]

Next steps
Now you’ve learned a few methods to make a model output structured data.

To learn more, check out the other how-to guides in this section, or the conceptual guide on tool calling.



Prompt Templates
Prompt templates help to translate user input and parameters into instructions for a language model. This can be used to guide a model's response, helping it understand the context and generate relevant and coherent language-based output.

Prompt Templates take as input an object, where each key represents a variable in the prompt template to fill in.

Prompt Templates output a PromptValue. This PromptValue can be passed to an LLM or a ChatModel, and can also be cast to a string or a list of messages. The reason this PromptValue exists is to make it easy to switch between strings and messages.

There are a few different types of prompt templates:

String PromptTemplates
These prompt templates are used to format a single string, and generally are used for simpler inputs. For example, a common way to construct and use a PromptTemplate is as follows:

import { PromptTemplate } from "@langchain/core/prompts";

const promptTemplate = PromptTemplate.fromTemplate(
  "Tell me a joke about {topic}"
);

await promptTemplate.invoke({ topic: "cats" });

StringPromptValue {
  value: 'Tell me a joke about cats'
}

ChatPromptTemplates
These prompt templates are used to format a list of messages. These "templates" consist of a list of templates themselves. For example, a common way to construct and use a ChatPromptTemplate is as follows:

import { ChatPromptTemplate } from "@langchain/core/prompts";

const promptTemplate = ChatPromptTemplate.fromMessages([
  ["system", "You are a helpful assistant"],
  ["user", "Tell me a joke about {topic}"],
]);

await promptTemplate.invoke({ topic: "cats" });

ChatPromptValue {
  messages: [
    SystemMessage {
      "content": "You are a helpful assistant",
      "additional_kwargs": {},
      "response_metadata": {}
    },
    HumanMessage {
      "content": "Tell me a joke about cats",
      "additional_kwargs": {},
      "response_metadata": {}
    }
  ]
}

In the above example, this ChatPromptTemplate will construct two messages when called. The first is a system message, that has no variables to format. The second is a HumanMessage, and will be formatted by the topic variable the user passes in.

MessagesPlaceholder
This prompt template is responsible for adding a list of messages in a particular place. In the above ChatPromptTemplate, we saw how we could format two messages, each one a string. But what if we wanted the user to pass in a list of messages that we would slot into a particular spot? This is how you use MessagesPlaceholder.

import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { HumanMessage } from "@langchain/core/messages";

const promptTemplate = ChatPromptTemplate.fromMessages([
  ["system", "You are a helpful assistant"],
  new MessagesPlaceholder("msgs"),
]);

await promptTemplate.invoke({ msgs: [new HumanMessage("hi!")] });

ChatPromptValue {
  messages: [
    SystemMessage {
      "content": "You are a helpful assistant",
      "additional_kwargs": {},
      "response_metadata": {}
    },
    HumanMessage {
      "content": "hi!",
      "additional_kwargs": {},
      "response_metadata": {}
    }
  ]
}

This will produce a list of two messages, the first one being a system message, and the second one being the HumanMessage we passed in. If we had passed in 5 messages, then it would have produced 6 messages in total (the system message plus the 5 passed in). This is useful for letting a list of messages be slotted into a particular spot.

An alternative way to accomplish the same thing without using the MessagesPlaceholder class explicitly is:

const promptTemplate = ChatPromptTemplate.fromMessages([
  ["system", "You are a helpful assistant"],
  ["placeholder", "{msgs}"], // <-- This is the changed part
]);

For specifics on how to use prompt templates, see the relevant how-to guides here.



How to use few shot examples
In this guide, we’ll learn how to create a simple prompt template that provides the model with example inputs and outputs when generating. Providing the LLM with a few such examples is called few-shotting, and is a simple yet powerful way to guide generation and in some cases drastically improve model performance.

A few-shot prompt template can be constructed from either a set of examples, or from an Example Selector class responsible for choosing a subset of examples from the defined set.

This guide will cover few-shotting with string prompt templates. For a guide on few-shotting with chat messages for chat models, see here.

Prerequisites
This guide assumes familiarity with the following concepts:

Prompt templates
Example selectors
LLMs
Vectorstores
Create a formatter for the few-shot examples
Configure a formatter that will format the few-shot examples into a string. This formatter should be a PromptTemplate object.

import { PromptTemplate } from "@langchain/core/prompts";

const examplePrompt = PromptTemplate.fromTemplate(
  "Question: {question}\n{answer}"
);

Creating the example set
Next, we’ll create a list of few-shot examples. Each example should be a dictionary representing an example input to the formatter prompt we defined above.

const examples = [
  {
    question: "Who lived longer, Muhammad Ali or Alan Turing?",
    answer: `
  Are follow up questions needed here: Yes.
  Follow up: How old was Muhammad Ali when he died?
  Intermediate answer: Muhammad Ali was 74 years old when he died.
  Follow up: How old was Alan Turing when he died?
  Intermediate answer: Alan Turing was 41 years old when he died.
  So the final answer is: Muhammad Ali
  `,
  },
  {
    question: "When was the founder of craigslist born?",
    answer: `
  Are follow up questions needed here: Yes.
  Follow up: Who was the founder of craigslist?
  Intermediate answer: Craigslist was founded by Craig Newmark.
  Follow up: When was Craig Newmark born?
  Intermediate answer: Craig Newmark was born on December 6, 1952.
  So the final answer is: December 6, 1952
  `,
  },
  {
    question: "Who was the maternal grandfather of George Washington?",
    answer: `
  Are follow up questions needed here: Yes.
  Follow up: Who was the mother of George Washington?
  Intermediate answer: The mother of George Washington was Mary Ball Washington.
  Follow up: Who was the father of Mary Ball Washington?
  Intermediate answer: The father of Mary Ball Washington was Joseph Ball.
  So the final answer is: Joseph Ball
  `,
  },
  {
    question:
      "Are both the directors of Jaws and Casino Royale from the same country?",
    answer: `
  Are follow up questions needed here: Yes.
  Follow up: Who is the director of Jaws?
  Intermediate Answer: The director of Jaws is Steven Spielberg.
  Follow up: Where is Steven Spielberg from?
  Intermediate Answer: The United States.
  Follow up: Who is the director of Casino Royale?
  Intermediate Answer: The director of Casino Royale is Martin Campbell.
  Follow up: Where is Martin Campbell from?
  Intermediate Answer: New Zealand.
  So the final answer is: No
  `,
  },
];

Pass the examples and formatter to FewShotPromptTemplate
Finally, create a FewShotPromptTemplate object. This object takes in the few-shot examples and the formatter for the few-shot examples. When this FewShotPromptTemplate is formatted, it formats the passed examples using the examplePrompt, then and adds them to the final prompt before suffix:

import { FewShotPromptTemplate } from "@langchain/core/prompts";

const prompt = new FewShotPromptTemplate({
  examples,
  examplePrompt,
  suffix: "Question: {input}",
  inputVariables: ["input"],
});

const formatted = await prompt.format({
  input: "Who was the father of Mary Ball Washington?",
});
console.log(formatted.toString());



Question: Who lived longer, Muhammad Ali or Alan Turing?

  Are follow up questions needed here: Yes.
  Follow up: How old was Muhammad Ali when he died?
  Intermediate answer: Muhammad Ali was 74 years old when he died.
  Follow up: How old was Alan Turing when he died?
  Intermediate answer: Alan Turing was 41 years old when he died.
  So the final answer is: Muhammad Ali


Question: When was the founder of craigslist born?

  Are follow up questions needed here: Yes.
  Follow up: Who was the founder of craigslist?
  Intermediate answer: Craigslist was founded by Craig Newmark.
  Follow up: When was Craig Newmark born?
  Intermediate answer: Craig Newmark was born on December 6, 1952.
  So the final answer is: December 6, 1952


Question: Who was the maternal grandfather of George Washington?

  Are follow up questions needed here: Yes.
  Follow up: Who was the mother of George Washington?
  Intermediate answer: The mother of George Washington was Mary Ball Washington.
  Follow up: Who was the father of Mary Ball Washington?
  Intermediate answer: The father of Mary Ball Washington was Joseph Ball.
  So the final answer is: Joseph Ball


Question: Are both the directors of Jaws and Casino Royale from the same country?

  Are follow up questions needed here: Yes.
  Follow up: Who is the director of Jaws?
  Intermediate Answer: The director of Jaws is Steven Spielberg.
  Follow up: Where is Steven Spielberg from?
  Intermediate Answer: The United States.
  Follow up: Who is the director of Casino Royale?
  Intermediate Answer: The director of Casino Royale is Martin Campbell.
  Follow up: Where is Martin Campbell from?
  Intermediate Answer: New Zealand.
  So the final answer is: No


Question: Who was the father of Mary Ball Washington?

By providing the model with examples like this, we can guide the model to a better response.

Using an example selector
We will reuse the example set and the formatter from the previous section. However, instead of feeding the examples directly into the FewShotPromptTemplate object, we will feed them into an implementation of ExampleSelector called SemanticSimilarityExampleSelector instance. This class selects few-shot examples from the initial set based on their similarity to the input. It uses an embedding model to compute the similarity between the input and the few-shot examples, as well as a vector store to perform the nearest neighbor search.

To show what it looks like, let’s initialize an instance and call it in isolation:

Set your OpenAI API key for the embeddings model

export OPENAI_API_KEY="..."

import { SemanticSimilarityExampleSelector } from "@langchain/core/example_selectors";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings } from "@langchain/openai";

const exampleSelector = await SemanticSimilarityExampleSelector.fromExamples(
  // This is the list of examples available to select from.
  examples,
  // This is the embedding class used to produce embeddings which are used to measure semantic similarity.
  new OpenAIEmbeddings(),
  // This is the VectorStore class that is used to store the embeddings and do a similarity search over.
  MemoryVectorStore,
  {
    // This is the number of examples to produce.
    k: 1,
  }
);

// Select the most similar example to the input.
const question = "Who was the father of Mary Ball Washington?";
const selectedExamples = await exampleSelector.selectExamples({ question });
console.log(`Examples most similar to the input: ${question}`);
for (const example of selectedExamples) {
  console.log("\n");
  console.log(
    Object.entries(example)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n")
  );
}

Examples most similar to the input: Who was the father of Mary Ball Washington?


question: Who was the maternal grandfather of George Washington?
answer:
  Are follow up questions needed here: Yes.
  Follow up: Who was the mother of George Washington?
  Intermediate answer: The mother of George Washington was Mary Ball Washington.
  Follow up: Who was the father of Mary Ball Washington?
  Intermediate answer: The father of Mary Ball Washington was Joseph Ball.
  So the final answer is: Joseph Ball


Now, let’s create a FewShotPromptTemplate object. This object takes in the example selector and the formatter prompt for the few-shot examples.

const prompt = new FewShotPromptTemplate({
  exampleSelector,
  examplePrompt,
  suffix: "Question: {input}",
  inputVariables: ["input"],
});

const formatted = await prompt.invoke({
  input: "Who was the father of Mary Ball Washington?",
});
console.log(formatted.toString());



Question: Who was the maternal grandfather of George Washington?

  Are follow up questions needed here: Yes.
  Follow up: Who was the mother of George Washington?
  Intermediate answer: The mother of George Washington was Mary Ball Washington.
  Follow up: Who was the father of Mary Ball Washington?
  Intermediate answer: The father of Mary Ball Washington was Joseph Ball.
  So the final answer is: Joseph Ball


Question: Who was the father of Mary Ball Washington?

Next steps
You’ve now learned how to add few-shot examples to your prompts.

Next, check out the other how-to guides on prompt templates in this section, the related how-to guide on few shotting with chat models, or the other example selector how-to guides.




How to partially format prompt templates
Prerequisites
This guide assumes familiarity with the following concepts:

Prompt templates
Like partially binding arguments to a function, it can make sense to "partial" a prompt template - e.g. pass in a subset of the required values, as to create a new prompt template which expects only the remaining subset of values.

LangChain supports this in two ways:

Partial formatting with string values.
Partial formatting with functions that return string values.
In the examples below, we go over the motivations for both use cases as well as how to do it in LangChain.

Partial with strings
One common use case for wanting to partial a prompt template is if you get access to some of the variables in a prompt before others. For example, suppose you have a prompt template that requires two variables, foo and baz. If you get the foo value early on in your chain, but the baz value later, it can be inconvenient to pass both variables all the way through the chain. Instead, you can partial the prompt template with the foo value, and then pass the partialed prompt template along and just use that. Below is an example of doing this:

import { PromptTemplate } from "langchain/prompts";

const prompt = new PromptTemplate({
  template: "{foo}{bar}",
  inputVariables: ["foo", "bar"],
});

const partialPrompt = await prompt.partial({
  foo: "foo",
});

const formattedPrompt = await partialPrompt.format({
  bar: "baz",
});

console.log(formattedPrompt);

// foobaz

You can also just initialize the prompt with the partialed variables.

const prompt = new PromptTemplate({
  template: "{foo}{bar}",
  inputVariables: ["bar"],
  partialVariables: {
    foo: "foo",
  },
});

const formattedPrompt = await prompt.format({
  bar: "baz",
});

console.log(formattedPrompt);

// foobaz

Partial With Functions
You can also partial with a function. The use case for this is when you have a variable you know that you always want to fetch in a common way. A prime example of this is with date or time. Imagine you have a prompt which you always want to have the current date. You can't hard code it in the prompt, and passing it along with the other input variables can be tedious. In this case, it's very handy to be able to partial the prompt with a function that always returns the current date.

const getCurrentDate = () => {
  return new Date().toISOString();
};

const prompt = new PromptTemplate({
  template: "Tell me a {adjective} joke about the day {date}",
  inputVariables: ["adjective", "date"],
});

const partialPrompt = await prompt.partial({
  date: getCurrentDate,
});

const formattedPrompt = await partialPrompt.format({
  adjective: "funny",
});

console.log(formattedPrompt);

// Tell me a funny joke about the day 2023-07-13T00:54:59.287Z

You can also just initialize the prompt with the partialed variables:

const prompt = new PromptTemplate({
  template: "Tell me a {adjective} joke about the day {date}",
  inputVariables: ["adjective"],
  partialVariables: {
    date: getCurrentDate,
  },
});

const formattedPrompt = await prompt.format({
  adjective: "funny",
});

console.log(formattedPrompt);

// Tell me a funny joke about the day 2023-07-13T00:54:59.287Z

Next steps
You've now learned how to partially apply variables to your prompt templates.

Next, check out the other how-to guides on prompt templates in this section, like adding few-shot examples to your prompt templates.




How to compose prompts together
Prerequisites
This guide assumes familiarity with the following concepts:

Prompt templates
LangChain provides a user friendly interface for composing different parts of prompts together. You can do this with either string prompts or chat prompts. Constructing prompts this way allows for easy reuse of components.

String prompt composition
When working with string prompts, each template is joined together. You can work with either prompts directly or strings (the first element in the list needs to be a prompt).

import { PromptTemplate } from "@langchain/core/prompts";

const prompt = PromptTemplate.fromTemplate(
  `Tell me a joke about {topic}, make it funny and in {language}`
);

prompt;

PromptTemplate {
  lc_serializable: true,
  lc_kwargs: {
    inputVariables: [ "topic", "language" ],
    templateFormat: "f-string",
    template: "Tell me a joke about {topic}, make it funny and in {language}"
  },
  lc_runnable: true,
  name: undefined,
  lc_namespace: [ "langchain_core", "prompts", "prompt" ],
  inputVariables: [ "topic", "language" ],
  outputParser: undefined,
  partialVariables: undefined,
  templateFormat: "f-string",
  template: "Tell me a joke about {topic}, make it funny and in {language}",
  validateTemplate: true
}

await prompt.format({ topic: "sports", language: "spanish" });

"Tell me a joke about sports, make it funny and in spanish"

Chat prompt composition
A chat prompt is made up a of a list of messages. Similarly to the above example, we can concatenate chat prompt templates. Each new element is a new message in the final prompt.

First, let’s initialize the a ChatPromptTemplate with a SystemMessage.

import {
  AIMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";

const prompt = new SystemMessage("You are a nice pirate");

You can then easily create a pipeline combining it with other messages or message templates. Use a BaseMessage when there are no variables to be formatted, use a MessageTemplate when there are variables to be formatted. You can also use just a string (note: this will automatically get inferred as a HumanMessagePromptTemplate.)

import { HumanMessagePromptTemplate } from "@langchain/core/prompts";

const newPrompt = HumanMessagePromptTemplate.fromTemplate([
  prompt,
  new HumanMessage("Hi"),
  new AIMessage("what?"),
  "{input}",
]);

Under the hood, this creates an instance of the ChatPromptTemplate class, so you can use it just as you did before!

await newPrompt.formatMessages({ input: "i said hi" });

[
  HumanMessage {
    lc_serializable: true,
    lc_kwargs: {
      content: [
        { type: "text", text: "You are a nice pirate" },
        { type: "text", text: "Hi" },
        { type: "text", text: "what?" },
        { type: "text", text: "i said hi" }
      ],
      additional_kwargs: {},
      response_metadata: {}
    },
    lc_namespace: [ "langchain_core", "messages" ],
    content: [
      { type: "text", text: "You are a nice pirate" },
      { type: "text", text: "Hi" },
      { type: "text", text: "what?" },
      { type: "text", text: "i said hi" }
    ],
    name: undefined,
    additional_kwargs: {},
    response_metadata: {}
  }
]

Using PipelinePrompt
LangChain includes a class called PipelinePromptTemplate, which can be useful when you want to reuse parts of prompts. A PipelinePrompt consists of two main parts:

Final prompt: The final prompt that is returned
Pipeline prompts: A list of tuples, consisting of a string name and a prompt template. Each prompt template will be formatted and then passed to future prompt templates as a variable with the same name.
import {
  PromptTemplate,
  PipelinePromptTemplate,
} from "@langchain/core/prompts";

const fullPrompt = PromptTemplate.fromTemplate(`{introduction}

{example}

{start}`);

const introductionPrompt = PromptTemplate.fromTemplate(
  `You are impersonating {person}.`
);

const examplePrompt =
  PromptTemplate.fromTemplate(`Here's an example of an interaction:
Q: {example_q}
A: {example_a}`);

const startPrompt = PromptTemplate.fromTemplate(`Now, do this for real!
Q: {input}
A:`);

const composedPrompt = new PipelinePromptTemplate({
  pipelinePrompts: [
    {
      name: "introduction",
      prompt: introductionPrompt,
    },
    {
      name: "example",
      prompt: examplePrompt,
    },
    {
      name: "start",
      prompt: startPrompt,
    },
  ],
  finalPrompt: fullPrompt,
});

const formattedPrompt = await composedPrompt.format({
  person: "Elon Musk",
  example_q: `What's your favorite car?`,
  example_a: "Telsa",
  input: `What's your favorite social media site?`,
});

console.log(formattedPrompt);

You are impersonating Elon Musk.

Here's an example of an interaction:
Q: What's your favorite car?
A: Telsa

Now, do this for real!
Q: What's your favorite social media site?
A:

Next steps
You’ve now learned how to compose prompts together.

Next, check out the other how-to guides on prompt templates in this section, like adding few-shot examples to your prompt templates.



How to cache chat model responses
Prerequisites
This guide assumes familiarity with the following concepts:

Chat models
LLMs
LangChain provides an optional caching layer for chat models. This is useful for two reasons:

It can save you money by reducing the number of API calls you make to the LLM provider, if you're often requesting the same completion multiple times. It can speed up your application by reducing the number of API calls you make to the LLM provider.

import { ChatOpenAI } from "@langchain/openai";

// To make the caching really obvious, lets use a slower model.
const model = new ChatOpenAI({
  model: "gpt-4",
  cache: true,
});

In Memory Cache
The default cache is stored in-memory. This means that if you restart your application, the cache will be cleared.

console.time();

// The first time, it is not yet in cache, so it should take longer
const res = await model.invoke("Tell me a joke!");
console.log(res);

console.timeEnd();

/*
  AIMessage {
    lc_serializable: true,
    lc_kwargs: {
      content: "Why don't scientists trust atoms?\n\nBecause they make up everything!",
      additional_kwargs: { function_call: undefined, tool_calls: undefined }
    },
    lc_namespace: [ 'langchain_core', 'messages' ],
    content: "Why don't scientists trust atoms?\n\nBecause they make up everything!",
    name: undefined,
    additional_kwargs: { function_call: undefined, tool_calls: undefined }
  }
  default: 2.224s
*/

console.time();

// The second time it is, so it goes faster
const res2 = await model.invoke("Tell me a joke!");
console.log(res2);

console.timeEnd();
/*
  AIMessage {
    lc_serializable: true,
    lc_kwargs: {
      content: "Why don't scientists trust atoms?\n\nBecause they make up everything!",
      additional_kwargs: { function_call: undefined, tool_calls: undefined }
    },
    lc_namespace: [ 'langchain_core', 'messages' ],
    content: "Why don't scientists trust atoms?\n\nBecause they make up everything!",
    name: undefined,
    additional_kwargs: { function_call: undefined, tool_calls: undefined }
  }
  default: 181.98ms
*/

Caching with Redis
LangChain also provides a Redis-based cache. This is useful if you want to share the cache across multiple processes or servers. To use it, you'll need to install the redis package:

npm
Yarn
pnpm
pnpm add ioredis @langchain/community @langchain/core

Then, you can pass a cache option when you instantiate the LLM. For example:

import { ChatOpenAI } from "@langchain/openai";
import { Redis } from "ioredis";
import { RedisCache } from "@langchain/community/caches/ioredis";

const client = new Redis("redis://localhost:6379");

const cache = new RedisCache(client, {
  ttl: 60, // Optional key expiration value
});

const model = new ChatOpenAI({ model: "gpt-4o-mini", cache });

const response1 = await model.invoke("Do something random!");
console.log(response1);
/*
  AIMessage {
    content: "Sure! I'll generate a random number for you: 37",
    additional_kwargs: {}
  }
*/

const response2 = await model.invoke("Do something random!");
console.log(response2);
/*
  AIMessage {
    content: "Sure! I'll generate a random number for you: 37",
    additional_kwargs: {}
  }
*/

await client.disconnect();

API Reference:
ChatOpenAI from @langchain/openai
RedisCache from @langchain/community/caches/ioredis
Caching with Upstash Redis
LangChain provides an Upstash Redis-based cache. Like the Redis-based cache, this cache is useful if you want to share the cache across multiple processes or servers. The Upstash Redis client uses HTTP and supports edge environments. To use it, you'll need to install the @upstash/redis package:

npm
Yarn
pnpm
pnpm add @upstash/redis

You'll also need an Upstash account and a Redis database to connect to. Once you've done that, retrieve your REST URL and REST token.

Then, you can pass a cache option when you instantiate the LLM. For example:

import { ChatOpenAI } from "@langchain/openai";
import { UpstashRedisCache } from "@langchain/community/caches/upstash_redis";

// See https://docs.upstash.com/redis/howto/connectwithupstashredis#quick-start for connection options
const cache = new UpstashRedisCache({
  config: {
    url: "UPSTASH_REDIS_REST_URL",
    token: "UPSTASH_REDIS_REST_TOKEN",
  },
  ttl: 3600,
});

const model = new ChatOpenAI({ model: "gpt-4o-mini", cache });

API Reference:
ChatOpenAI from @langchain/openai
UpstashRedisCache from @langchain/community/caches/upstash_redis
You can also directly pass in a previously created @upstash/redis client instance:

import { Redis } from "@upstash/redis";
import https from "https";

import { ChatOpenAI } from "@langchain/openai";
import { UpstashRedisCache } from "@langchain/community/caches/upstash_redis";

// const client = new Redis({
//   url: process.env.UPSTASH_REDIS_REST_URL!,
//   token: process.env.UPSTASH_REDIS_REST_TOKEN!,
//   agent: new https.Agent({ keepAlive: true }),
// });

// Or simply call Redis.fromEnv() to automatically load the UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables.
const client = Redis.fromEnv({
  agent: new https.Agent({ keepAlive: true }),
});

const cache = new UpstashRedisCache({ client });
const model = new ChatOpenAI({ model: "gpt-4o-mini", cache });


API Reference:
ChatOpenAI from @langchain/openai
UpstashRedisCache from @langchain/community/caches/upstash_redis
Caching with Vercel KV
LangChain provides an Vercel KV-based cache. Like the Redis-based cache, this cache is useful if you want to share the cache across multiple processes or servers. The Vercel KV client uses HTTP and supports edge environments. To use it, you'll need to install the @vercel/kv package:

npm
Yarn
pnpm
pnpm add @vercel/kv

You'll also need an Vercel account and a KV database to connect to. Once you've done that, retrieve your REST URL and REST token.

Then, you can pass a cache option when you instantiate the LLM. For example:

import { ChatOpenAI } from "@langchain/openai";
import { VercelKVCache } from "@langchain/community/caches/vercel_kv";
import { createClient } from "@vercel/kv";

// See https://vercel.com/docs/storage/vercel-kv/kv-reference#createclient-example for connection options
const cache = new VercelKVCache({
  client: createClient({
    url: "VERCEL_KV_API_URL",
    token: "VERCEL_KV_API_TOKEN",
  }),
  ttl: 3600,
});

const model = new ChatOpenAI({
  model: "gpt-4o-mini",
  cache,
});

API Reference:
ChatOpenAI from @langchain/openai
VercelKVCache from @langchain/community/caches/vercel_kv
Caching with Cloudflare KV
info
This integration is only supported in Cloudflare Workers.

If you're deploying your project as a Cloudflare Worker, you can use LangChain's Cloudflare KV-powered LLM cache.

For information on how to set up KV in Cloudflare, see the official documentation.

Note: If you are using TypeScript, you may need to install types if they aren't already present:

npm
Yarn
pnpm
pnpm add @cloudflare/workers-types

import type { KVNamespace } from "@cloudflare/workers-types";

import { ChatOpenAI } from "@langchain/openai";
import { CloudflareKVCache } from "@langchain/cloudflare";

export interface Env {
  KV_NAMESPACE: KVNamespace;
  OPENAI_API_KEY: string;
}

export default {
  async fetch(_request: Request, env: Env) {
    try {
      const cache = new CloudflareKVCache(env.KV_NAMESPACE);
      const model = new ChatOpenAI({
        cache,
        model: "gpt-3.5-turbo",
        apiKey: env.OPENAI_API_KEY,
      });
      const response = await model.invoke("How are you today?");
      return new Response(JSON.stringify(response), {
        headers: { "content-type": "application/json" },
      });
    } catch (err: any) {
      console.log(err.message);
      return new Response(err.message, { status: 500 });
    }
  },
};

API Reference:
ChatOpenAI from @langchain/openai
CloudflareKVCache from @langchain/cloudflare
Caching on the File System
danger
This cache is not recommended for production use. It is only intended for local development.

LangChain provides a simple file system cache. By default the cache is stored a temporary directory, but you can specify a custom directory if you want.

const cache = await LocalFileCache.create();

Next steps
You've now learned how to cache model responses to save time and money.

Next, check out the other how-to guides on chat models, like how to get a model to return structured output or how to create your own custom chat model.



How to pass tool outputs to chat models
Prerequisites
This guide assumes familiarity with the following concepts:

LangChain Tools
Tool calling
Using chat models to call tools
Defining custom tools
Some models are capable of tool calling - generating arguments that conform to a specific user-provided schema. This guide will demonstrate how to use those tool calls to actually call a function and properly pass the results back to the model.





First, let’s define our tools and our model:

import { z } from "zod";
import { tool } from "@langchain/core/tools";

const addTool = tool(
  async ({ a, b }) => {
    return a + b;
  },
  {
    name: "add",
    schema: z.object({
      a: z.number(),
      b: z.number(),
    }),
    description: "Adds a and b.",
  }
);

const multiplyTool = tool(
  async ({ a, b }) => {
    return a * b;
  },
  {
    name: "multiply",
    schema: z.object({
      a: z.number(),
      b: z.number(),
    }),
    description: "Multiplies a and b.",
  }
);

const tools = [addTool, multiplyTool];

Pick your chat model:
Groq
OpenAI
Anthropic
Google Gemini
FireworksAI
MistralAI
VertexAI
Install dependencies
tip
See this section for general instructions on installing integration packages.

npm
yarn
pnpm
pnpm add @langchain/groq 

Add environment variables
GROQ_API_KEY=your-api-key

Instantiate the model
import { ChatGroq } from "@langchain/groq";

const llm = new ChatGroq({
  model: "llama-3.3-70b-versatile",
  temperature: 0
});

Now, let’s get the model to call a tool. We’ll add it to a list of messages that we’ll treat as conversation history:

import { HumanMessage } from "@langchain/core/messages";

const llmWithTools = llm.bindTools(tools);

const messages = [new HumanMessage("What is 3 * 12? Also, what is 11 + 49?")];

const aiMessage = await llmWithTools.invoke(messages);

console.log(aiMessage);

messages.push(aiMessage);

AIMessage {
  "id": "chatcmpl-9p1NbC7sfZP0FE0bNfFiVYbPuWivg",
  "content": "",
  "additional_kwargs": {
    "tool_calls": [
      {
        "id": "call_RbUuLMYf3vgcdSQ8bhy1D5Ty",
        "type": "function",
        "function": "[Object]"
      },
      {
        "id": "call_Bzz1qgQjTlQIHMcEaDAdoH8X",
        "type": "function",
        "function": "[Object]"
      }
    ]
  },
  "response_metadata": {
    "tokenUsage": {
      "completionTokens": 50,
      "promptTokens": 87,
      "totalTokens": 137
    },
    "finish_reason": "tool_calls",
    "system_fingerprint": "fp_400f27fa1f"
  },
  "tool_calls": [
    {
      "name": "multiply",
      "args": {
        "a": 3,
        "b": 12
      },
      "type": "tool_call",
      "id": "call_RbUuLMYf3vgcdSQ8bhy1D5Ty"
    },
    {
      "name": "add",
      "args": {
        "a": 11,
        "b": 49
      },
      "type": "tool_call",
      "id": "call_Bzz1qgQjTlQIHMcEaDAdoH8X"
    }
  ],
  "invalid_tool_calls": [],
  "usage_metadata": {
    "input_tokens": 87,
    "output_tokens": 50,
    "total_tokens": 137
  }
}
2

Next let’s invoke the tool functions using the args the model populated!

Conveniently, if we invoke a LangChain Tool with a ToolCall, we’ll automatically get back a ToolMessage that can be fed back to the model:

Compatibility
This functionality requires @langchain/core>=0.2.16. Please see here for a guide on upgrading.

If you are on earlier versions of @langchain/core, you will need to access construct a ToolMessage manually using fields from the tool call.

const toolsByName = {
  add: addTool,
  multiply: multiplyTool,
};

for (const toolCall of aiMessage.tool_calls) {
  const selectedTool = toolsByName[toolCall.name];
  const toolMessage = await selectedTool.invoke(toolCall);
  messages.push(toolMessage);
}

console.log(messages);

[
  HumanMessage {
    "content": "What is 3 * 12? Also, what is 11 + 49?",
    "additional_kwargs": {},
    "response_metadata": {}
  },
  AIMessage {
    "id": "chatcmpl-9p1NbC7sfZP0FE0bNfFiVYbPuWivg",
    "content": "",
    "additional_kwargs": {
      "tool_calls": [
        {
          "id": "call_RbUuLMYf3vgcdSQ8bhy1D5Ty",
          "type": "function",
          "function": "[Object]"
        },
        {
          "id": "call_Bzz1qgQjTlQIHMcEaDAdoH8X",
          "type": "function",
          "function": "[Object]"
        }
      ]
    },
    "response_metadata": {
      "tokenUsage": {
        "completionTokens": 50,
        "promptTokens": 87,
        "totalTokens": 137
      },
      "finish_reason": "tool_calls",
      "system_fingerprint": "fp_400f27fa1f"
    },
    "tool_calls": [
      {
        "name": "multiply",
        "args": {
          "a": 3,
          "b": 12
        },
        "type": "tool_call",
        "id": "call_RbUuLMYf3vgcdSQ8bhy1D5Ty"
      },
      {
        "name": "add",
        "args": {
          "a": 11,
          "b": 49
        },
        "type": "tool_call",
        "id": "call_Bzz1qgQjTlQIHMcEaDAdoH8X"
      }
    ],
    "invalid_tool_calls": [],
    "usage_metadata": {
      "input_tokens": 87,
      "output_tokens": 50,
      "total_tokens": 137
    }
  },
  ToolMessage {
    "content": "36",
    "name": "multiply",
    "additional_kwargs": {},
    "response_metadata": {},
    "tool_call_id": "call_RbUuLMYf3vgcdSQ8bhy1D5Ty"
  },
  ToolMessage {
    "content": "60",
    "name": "add",
    "additional_kwargs": {},
    "response_metadata": {},
    "tool_call_id": "call_Bzz1qgQjTlQIHMcEaDAdoH8X"
  }
]

And finally, we’ll invoke the model with the tool results. The model will use this information to generate a final answer to our original query:

await llmWithTools.invoke(messages);

AIMessage {
  "id": "chatcmpl-9p1NttGpWjx1cQoVIDlMhumYq12Pe",
  "content": "3 * 12 is 36, and 11 + 49 is 60.",
  "additional_kwargs": {},
  "response_metadata": {
    "tokenUsage": {
      "completionTokens": 19,
      "promptTokens": 153,
      "totalTokens": 172
    },
    "finish_reason": "stop",
    "system_fingerprint": "fp_18cc0f1fa0"
  },
  "tool_calls": [],
  "invalid_tool_calls": [],
  "usage_metadata": {
    "input_tokens": 153,
    "output_tokens": 19,
    "total_tokens": 172
  }
}

Note that each ToolMessage must include a tool_call_id that matches an id in the original tool calls that the model generates. This helps the model match tool responses with tool calls.

Tool calling agents, like those in LangGraph, use this basic flow to answer queries and solve tasks.

Related
You’ve now seen how to pass tool calls back to a model.

These guides may interest you next:

LangGraph quickstart
Few shot prompting with tools
Stream tool calls
Pass runtime values to tools
Getting structured outputs from models



Tools
Prerequisites
Chat models
Overview
The tool abstraction in LangChain associates a TypeScript function with a schema that defines the function's name, description and input.

Tools can be passed to chat models that support tool calling allowing the model to request the execution of a specific function with specific inputs.

Key concepts
Tools are a way to encapsulate a function and its schema in a way that can be passed to a chat model.
Create tools using the tool function, which simplifies the process of tool creation, supporting the following:
Defining tools that return artifacts (e.g. images, etc.)
Hiding input arguments from the schema (and hence from the model) using injected tool arguments.
Tool interface
The tool interface is defined in the StructuredTool class which is a subclass of the Runnable Interface.

The key attributes that correspond to the tool's schema:

name: The name of the tool.
description: A description of what the tool does.
args: Property that returns the JSON schema for the tool's arguments.
The key methods to execute the function associated with the tool:

invoke: Invokes the tool with the given arguments.
Create tools using the tool function
The recommended way to create tools is using the tool function. This function is designed to simplify the process of tool creation and should be used in most cases.

import { tool } from "@langchain/core/tools";
import { z } from "zod";

const multiply = tool(
  ({ a, b }: { a: number; b: number }): number => {
    /**
     * Multiply two numbers.
     */
    return a * b;
  },
  {
    name: "multiply",
    description: "Multiply two numbers",
    schema: z.object({
      a: z.number(),
      b: z.number(),
    }),
  }
);

For more details on how to create tools, see the how to create custom tools guide.

note
LangChain has a few other ways to create tools; e.g., by sub-classing the StructuredTool class or by using StructuredTool. These methods are shown in the how to create custom tools guide, but we generally recommend using the tool function for most cases.

Use the tool directly
Once you have defined a tool, you can use it directly by calling the function. For example, to use the multiply tool defined above:

await multiply.invoke({ a: 2, b: 3 });

Inspect
You can also inspect the tool's schema and other properties:

console.log(multiply.name); // multiply
console.log(multiply.description); // Multiply two numbers.

note
If you're using pre-built LangChain or LangGraph components like createReactAgent,you might not need to interact with tools directly. However, understanding how to use them can be valuable for debugging and testing. Additionally, when building custom LangGraph workflows, you may find it necessary to work with tools directly.

Configuring the schema
The tool function offers additional options to configure the schema of the tool (e.g., modify name, description or parse the function's doc-string to infer the schema).

Please see the API reference for tool for more details and review the how to create custom tools guide for examples.

Tool artifacts
Tools are utilities that can be called by a model, and whose outputs are designed to be fed back to a model. Sometimes, however, there are artifacts of a tool's execution that we want to make accessible to downstream components in our chain or agent, but that we don't want to expose to the model itself. For example if a tool returns a custom object, a dataframe or an image, we may want to pass some metadata about this output to the model without passing the actual output to the model. At the same time, we may want to be able to access this full output elsewhere, for example in downstream tools.

const someTool = tool(({ ... }) => {
    // do something
}, {
  // ... tool schema args
  // Set the returnType to "content_and_artifact"
  responseFormat: "content_and_artifact"
});

See how to return artifacts from tools for more details.

RunnableConfig
You can use the RunnableConfig object to pass custom run time values to tools.

If you need to access the RunnableConfig object from within a tool. This can be done by using the RunnableConfig in the tool's function signature.

import { RunnableConfig } from "@langchain/core/runnables";

const someTool = tool(
    async (args: any, config: RunnableConfig): Promise<[string, any]> => {
        /**
         * Tool that does something.
         */
    },
    {
        name: "some_tool",
        description: "Tool that does something",
        schema: z.object({ ... }),
        returnType: "content_and_artifact"
    }
);


await someTool.invoke(..., { configurable: { value: "some_value" } });

The config will not be part of the tool's schema and will be injected at runtime with appropriate values.

Best practices
When designing tools to be used by models, keep the following in mind:

Tools that are well-named, correctly-documented and properly type-hinted are easier for models to use.
Design simple and narrowly scoped tools, as they are easier for models to use correctly.
Use chat models that support tool-calling APIs to take advantage of tools.
Toolkits
LangChain has a concept of toolkits. This a very thin abstraction that groups tools together that are designed to be used together for specific tasks.

Interface
All Toolkits expose a getTools method which returns a list of tools. You can therefore do:

// Initialize a toolkit
const toolkit = new ExampleTookit(...)

// Get list of tools
const tools = toolkit.getTools()

Related resources
See the following resources for more information:

API Reference for tool
How to create custom tools
How to pass run time values to tools
All LangChain tool how-to guides
Additional how-to guides that show usage with LangGraph
Tool integrations, see the tool integration docs.



Tool calling
[Prerequisites]
Tools
Chat Models
Overview
Many AI applications interact directly with humans. In these cases, it is appropriate for models to respond in natural language. But what about cases where we want a model to also interact directly with systems, such as databases or an API? These systems often have a particular input schema; for example, APIs frequently have a required payload structure. This need motivates the concept of tool calling. You can use tool calling to request model responses that match a particular schema.

info
You will sometimes hear the term function calling. We use this term interchangeably with tool calling.

Conceptual overview of tool calling

Key concepts
(1) Tool Creation: Use the tool function to create a tool. A tool is an association between a function and its schema. (2) Tool Binding: The tool needs to be connected to a model that supports tool calling. This gives the model awareness of the tool and the associated input schema required by the tool. (3) Tool Calling: When appropriate, the model can decide to call a tool and ensure its response conforms to the tool's input schema. (4) Tool Execution: The tool can be executed using the arguments provided by the model.

Conceptual parts of tool calling

Recommended usage
This pseudo-code illustrates the recommended workflow for using tool calling. Created tools are passed to .bindTools() method as a list. This model can be called, as usual. If a tool call is made, model's response will contain the tool call arguments. The tool call arguments can be passed directly to the tool.

// Tool creation
const tools = [myTool];
// Tool binding
const modelWithTools = model.bindTools(tools);
// Tool calling
const response = await modelWithTools.invoke(userInput);

Tool creation
The recommended way to create a tool is using the tool function.

import { tool } from "@langchain/core/tools";

const multiply = tool(
  ({ a, b }: { a: number; b: number }): number => {
    /**
     * Multiply a and b.
     */
    return a * b;
  },
  {
    name: "multiply",
    description: "Multiply two numbers",
    schema: z.object({
      a: z.number(),
      b: z.number(),
    }),
  }
);

[Further reading]
See our conceptual guide on tools for more details.
See our model integrations that support tool calling.
See our how-to guide on tool calling.
For tool calling that does not require a function to execute, you can also define just the tool schema:

const multiplyTool = {
  name: "multiply",
  description: "Multiply two numbers",
  schema: z.object({
    a: z.number(),
    b: z.number(),
  }),
};

Tool binding
Many model providers support tool calling.

tip
See our model integration page for a list of providers that support tool calling.

The central concept to understand is that LangChain provides a standardized interface for connecting tools to models. The .bindTools() method can be used to specify which tools are available for a model to call.

const modelWithTools = model.bindTools([toolsList]);

As a specific example, let's take a function multiply and bind it as a tool to a model that supports tool calling.

const multiply = tool(
  ({ a, b }: { a: number; b: number }): number => {
    /**
     * Multiply a and b.
     *
     * @param a - first number
     * @param b - second number
     * @returns The product of a and b
     */
    return a * b;
  },
  {
    name: "multiply",
    description: "Multiply two numbers",
    schema: z.object({
      a: z.number(),
      b: z.number(),
    }),
  }
);

const llmWithTools = toolCallingModel.bindTools([multiply]);

Tool calling
Diagram of a tool call by a model

A key principle of tool calling is that the model decides when to use a tool based on the input's relevance. The model doesn't always need to call a tool. For example, given an unrelated input, the model would not call the tool:

const result = await llmWithTools.invoke("Hello world!");

The result would be an AIMessage containing the model's response in natural language (e.g., "Hello!"). However, if we pass an input relevant to the tool, the model should choose to call it:

const result = await llmWithTools.invoke("What is 2 multiplied by 3?");

As before, the output result will be an AIMessage. But, if the tool was called, result will have a tool_calls attribute. This attribute includes everything needed to execute the tool, including the tool name and input arguments:

result.tool_calls
{'name': 'multiply', 'args': {'a': 2, 'b': 3}, 'id': 'xxx', 'type': 'tool_call'}

For more details on usage, see our how-to guides!

Tool execution
Tools implement the Runnable interface, which means that they can be invoked (e.g., tool.invoke(args)) directly.

LangGraph offers pre-built components (e.g., ToolNode) that will often invoke the tool in behalf of the user.

[Further reading]
See our how-to guide on tool calling.
See the LangGraph documentation on using ToolNode.
Best practices
When designing tools to be used by a model, it is important to keep in mind that:

Models that have explicit tool-calling APIs will be better at tool calling than non-fine-tuned models.
Models will perform better if the tools have well-chosen names and descriptions.
Simple, narrowly scoped tools are easier for models to use than complex tools.
Asking the model to select from a large list of tools poses challenges for the model.





How to use chat models to call tools
Prerequisites
This guide assumes familiarity with the following concepts:

Chat models
LangChain Tools
Tool calling
Tool calling allows a chat model to respond to a given prompt by “calling a tool”.

Remember, while the name “tool calling” implies that the model is directly performing some action, this is actually not the case! The model only generates the arguments to a tool, and actually running the tool (or not) is up to the user.

Tool calling is a general technique that generates structured output from a model, and you can use it even when you don’t intend to invoke any tools. An example use-case of that is extraction from unstructured text.



If you want to see how to use the model-generated tool call to actually run a tool function check out this guide.

Supported models
Tool calling is not universal, but is supported by many popular LLM providers, including Anthropic, Cohere, Google, Mistral, OpenAI, and even for locally-running models via Ollama.

You can find a list of all models that support tool calling here.

LangChain implements standard interfaces for defining tools, passing them to LLMs, and representing tool calls. This guide will cover how to bind tools to an LLM, then invoke the LLM to generate these arguments.

LangChain implements standard interfaces for defining tools, passing them to LLMs, and representing tool calls. This guide will show you how to use them.

Passing tools to chat models
Chat models that support tool calling features implement a .bindTools() method, which receives a list of LangChain tool objects and binds them to the chat model in its expected format. Subsequent invocations of the chat model will include tool schemas in its calls to the LLM.

note
As of @langchain/core version 0.2.9, all chat models with tool calling capabilities now support OpenAI-formatted tools.

Let’s walk through an example:

Pick your chat model:
Anthropic
OpenAI
MistralAI
FireworksAI
Install dependencies
tip
See this section for general instructions on installing integration packages.

npm
yarn
pnpm
pnpm add @langchain/anthropic @langchain/core

Add environment variables
ANTHROPIC_API_KEY=your-api-key

Instantiate the model
import { ChatAnthropic } from "@langchain/anthropic";

const llm = new ChatAnthropic({
  model: "claude-3-5-sonnet-20240620",
  temperature: 0
});

We can use the .bindTools() method to handle the conversion from LangChain tool to our model provider’s specific format and bind it to the model (i.e., passing it in each time the model is invoked). A number of models implement helper methods that will take care of formatting and binding different function-like objects to the model. Let’s create a new tool implementing a Zod schema, then bind it to the model:

note
The tool function is available in @langchain/core version 0.2.7 and above.

If you are on an older version of core, you should use instantiate and use DynamicStructuredTool instead.

import { tool } from "@langchain/core/tools";
import { z } from "zod";

/**
 * Note that the descriptions here are crucial, as they will be passed along
 * to the model along with the class name.
 */
const calculatorSchema = z.object({
  operation: z
    .enum(["add", "subtract", "multiply", "divide"])
    .describe("The type of operation to execute."),
  number1: z.number().describe("The first number to operate on."),
  number2: z.number().describe("The second number to operate on."),
});

const calculatorTool = tool(
  async ({ operation, number1, number2 }) => {
    // Functions must return strings
    if (operation === "add") {
      return `${number1 + number2}`;
    } else if (operation === "subtract") {
      return `${number1 - number2}`;
    } else if (operation === "multiply") {
      return `${number1 * number2}`;
    } else if (operation === "divide") {
      return `${number1 / number2}`;
    } else {
      throw new Error("Invalid operation.");
    }
  },
  {
    name: "calculator",
    description: "Can perform mathematical operations.",
    schema: calculatorSchema,
  }
);

const llmWithTools = llm.bindTools([calculatorTool]);

Now, let’s invoke it! We expect the model to use the calculator to answer the question:

const res = await llmWithTools.invoke("What is 3 * 12");

console.log(res);

AIMessage {
  "id": "chatcmpl-9p1Ib4xfxV4yahv2ZWm1IRb1fRVD7",
  "content": "",
  "additional_kwargs": {
    "tool_calls": [
      {
        "id": "call_CrZkMP0AvUrz7w9kim0splbl",
        "type": "function",
        "function": "[Object]"
      }
    ]
  },
  "response_metadata": {
    "tokenUsage": {
      "completionTokens": 24,
      "promptTokens": 93,
      "totalTokens": 117
    },
    "finish_reason": "tool_calls",
    "system_fingerprint": "fp_400f27fa1f"
  },
  "tool_calls": [
    {
      "name": "calculator",
      "args": {
        "operation": "multiply",
        "number1": 3,
        "number2": 12
      },
      "type": "tool_call",
      "id": "call_CrZkMP0AvUrz7w9kim0splbl"
    }
  ],
  "invalid_tool_calls": [],
  "usage_metadata": {
    "input_tokens": 93,
    "output_tokens": 24,
    "total_tokens": 117
  }
}

As we can see our LLM generated arguments to a tool!

Note: If you are finding that the model does not call a desired tool for a given prompt, you can see this guide on how to force the LLM to call a tool rather than letting it decide.

tip
See a LangSmith trace for the above here.

Tool calls
If tool calls are included in a LLM response, they are attached to the corresponding message or message chunk as a list of tool call objects in the .tool_calls attribute.

A ToolCall is a typed dict that includes a tool name, dict of argument values, and (optionally) an identifier. Messages with no tool calls default to an empty list for this attribute.

Chat models can call multiple tools at once. Here’s an example:

const res = await llmWithTools.invoke("What is 3 * 12? Also, what is 11 + 49?");

res.tool_calls;

[
  {
    name: 'calculator',
    args: { operation: 'multiply', number1: 3, number2: 12 },
    type: 'tool_call',
    id: 'call_01lvdk2COLV2hTjRUNAX8XWH'
  },
  {
    name: 'calculator',
    args: { operation: 'add', number1: 11, number2: 49 },
    type: 'tool_call',
    id: 'call_fB0vo8VC2HRojZcj120xIBxM'
  }
]

The .tool_calls attribute should contain valid tool calls. Note that on occasion, model providers may output malformed tool calls (e.g., arguments that are not valid JSON). When parsing fails in these cases, instances of InvalidToolCall are populated in the .invalid_tool_calls attribute. An InvalidToolCall can have a name, string arguments, identifier, and error message.

Binding model-specific formats (advanced)
Providers adopt different conventions for formatting tool schemas. For instance, OpenAI uses a format like this:

type: The type of the tool. At the time of writing, this is always “function”.
function: An object containing tool parameters.
function.name: The name of the schema to output.
function.description: A high level description of the schema to output.
function.parameters: The nested details of the schema you want to extract, formatted as a JSON schema object.
We can bind this model-specific format directly to the model if needed. Here’s an example:

import { ChatOpenAI } from "@langchain/openai";

const model = new ChatOpenAI({ model: "gpt-4o" });

const modelWithTools = model.bind({
  tools: [
    {
      type: "function",
      function: {
        name: "calculator",
        description: "Can perform mathematical operations.",
        parameters: {
          type: "object",
          properties: {
            operation: {
              type: "string",
              description: "The type of operation to execute.",
              enum: ["add", "subtract", "multiply", "divide"],
            },
            number1: { type: "number", description: "First integer" },
            number2: { type: "number", description: "Second integer" },
          },
          required: ["number1", "number2"],
        },
      },
    },
  ],
});

await modelWithTools.invoke(`Whats 119 times 8?`);

AIMessage {
  "id": "chatcmpl-9p1IeP7mIp3jPn1wgsP92zxEfNo7k",
  "content": "",
  "additional_kwargs": {
    "tool_calls": [
      {
        "id": "call_P5Xgyi0Y7IfisaUmyapZYT7d",
        "type": "function",
        "function": "[Object]"
      }
    ]
  },
  "response_metadata": {
    "tokenUsage": {
      "completionTokens": 24,
      "promptTokens": 85,
      "totalTokens": 109
    },
    "finish_reason": "tool_calls",
    "system_fingerprint": "fp_400f27fa1f"
  },
  "tool_calls": [
    {
      "name": "calculator",
      "args": {
        "operation": "multiply",
        "number1": 119,
        "number2": 8
      },
      "type": "tool_call",
      "id": "call_P5Xgyi0Y7IfisaUmyapZYT7d"
    }
  ],
  "invalid_tool_calls": [],
  "usage_metadata": {
    "input_tokens": 85,
    "output_tokens": 24,
    "total_tokens": 109
  }
}

This is functionally equivalent to the bind_tools() calls above.

Next steps
Now you’ve learned how to bind tool schemas to a chat model and have the model call the tool.

Next, check out this guide on actually using the tool by invoking the function and passing the results back to the model:

Pass tool results back to model
You can also check out some more specific uses of tool calling:

Few shot prompting with tools
Stream tool calls
Pass runtime values to tools
Getting structured outputs from models




How to create Tools
Prerequisites
This guide assumes familiarity with the following concepts:

LangChain tools
Agents
When constructing your own agent, you will need to provide it with a list of Tools that it can use. While LangChain includes some prebuilt tools, it can often be more useful to use tools that use custom logic. This guide will walk you through some ways you can create custom tools.

The biggest difference here is that the first function requires an object with multiple input fields, while the second one only accepts an object with a single field. Some older agents only work with functions that require single inputs, so it’s important to understand the distinction.

LangChain has a handful of ways to construct tools for different applications. Below I’ll show the two most common ways to create tools, and where you might use each.

Tool schema
Compatibility
Only available in @langchain/core version 0.2.19 and above.

The simplest way to create a tool is through the StructuredToolParams schema. Every chat model which supports tool calling in LangChain accepts binding tools to the model through this schema. This schema has only three fields

name - The name of the tool.
schema - The schema of the tool, defined with a Zod object.
description (optional) - A description of the tool.
This schema does not include a function to pair with the tool, and for this reason it should only be used in situations where the generated output does not need to be passed as the input argument to a function.

import { z } from "zod";
import { StructuredToolParams } from "@langchain/core/tools";

const simpleToolSchema: StructuredToolParams = {
  name: "get_current_weather",
  description: "Get the current weather for a location",
  schema: z.object({
    city: z.string().describe("The city to get the weather for"),
    state: z.string().optional().describe("The state to get the weather for"),
  }),
};

tool function
Compatibility
Only available in @langchain/core version 0.2.7 and above.

The tool wrapper function is a convenience method for turning a JavaScript function into a tool. It requires the function itself along with some additional arguments that define your tool. You should use this over StructuredToolParams tools when the resulting tool call executes a function. The most important are:

The tool’s name, which the LLM will use as context as well as to reference the tool
An optional, but recommended description, which the LLM will use as context to know when to use the tool
A schema, which defines the shape of the tool’s input
The tool function will return an instance of the StructuredTool class, so it is compatible with all the existing tool calling infrastructure in the LangChain library.

import { z } from "zod";
import { tool } from "@langchain/core/tools";

const adderSchema = z.object({
  a: z.number(),
  b: z.number(),
});
const adderTool = tool(
  async (input): Promise<string> => {
    const sum = input.a + input.b;
    return `The sum of ${input.a} and ${input.b} is ${sum}`;
  },
  {
    name: "adder",
    description: "Adds two numbers together",
    schema: adderSchema,
  }
);

await adderTool.invoke({ a: 1, b: 2 });

"The sum of 1 and 2 is 3"

DynamicStructuredTool
You can also use the DynamicStructuredTool class to declare tools. Here’s an example - note that tools must always return strings!

import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

const multiplyTool = new DynamicStructuredTool({
  name: "multiply",
  description: "multiply two numbers together",
  schema: z.object({
    a: z.number().describe("the first number to multiply"),
    b: z.number().describe("the second number to multiply"),
  }),
  func: async ({ a, b }: { a: number; b: number }) => {
    return (a * b).toString();
  },
});

await multiplyTool.invoke({ a: 8, b: 9 });

"72"

DynamicTool
For older agents that require tools which accept only a single input, you can pass the relevant parameters to the DynamicTool class. This is useful when working with older agents that only support tools that accept a single input. In this case, no schema is required:

import { DynamicTool } from "@langchain/core/tools";

const searchTool = new DynamicTool({
  name: "search",
  description: "look things up online",
  func: async (_input: string) => {
    return "LangChain";
  },
});

await searchTool.invoke("foo");

"LangChain"

Returning artifacts of Tool execution
Sometimes there are artifacts of a tool’s execution that we want to make accessible to downstream components in our chain or agent, but that we don’t want to expose to the model itself. For example if a tool returns custom objects like Documents, we may want to pass some view or metadata about this output to the model without passing the raw output to the model. At the same time, we may want to be able to access this full output elsewhere, for example in downstream tools.

The Tool and ToolMessage interfaces make it possible to distinguish between the parts of the tool output meant for the model (ToolMessage.content) and those parts which are meant for use outside the model (ToolMessage.artifact).

Compatibility
This functionality was added in @langchain/core>=0.2.16. Please make sure your package is up to date.

If you want your tool to distinguish between message content and other artifacts, we need to do three things:

Set the response_format parameter to "content_and_artifact" when defining the tool.
Make sure that we return a tuple of [content, artifact].
Call the tool with a a ToolCall (like the ones generated by tool-calling models) rather than with the required schema directly.
Here’s an example of what this looks like. First, create a new tool:

import { z } from "zod";
import { tool } from "@langchain/core/tools";

const randomIntToolSchema = z.object({
  min: z.number(),
  max: z.number(),
  size: z.number(),
});

const generateRandomInts = tool(
  async ({ min, max, size }) => {
    const array: number[] = [];
    for (let i = 0; i < size; i++) {
      array.push(Math.floor(Math.random() * (max - min + 1)) + min);
    }
    return [
      `Successfully generated array of ${size} random ints in [${min}, ${max}].`,
      array,
    ];
  },
  {
    name: "generateRandomInts",
    description: "Generate size random ints in the range [min, max].",
    schema: randomIntToolSchema,
    responseFormat: "content_and_artifact",
  }
);

If you invoke our tool directly with the tool arguments, you’ll get back just the content part of the output:

await generateRandomInts.invoke({ min: 0, max: 9, size: 10 });

"Successfully generated array of 10 random ints in [0, 9]."

But if you invoke our tool with a ToolCall, you’ll get back a ToolMessage that contains both the content and artifact generated by the Tool:

await generateRandomInts.invoke({
  name: "generateRandomInts",
  args: { min: 0, max: 9, size: 10 },
  id: "123", // required
  type: "tool_call",
});

ToolMessage {
  lc_serializable: true,
  lc_kwargs: {
    content: "Successfully generated array of 10 random ints in [0, 9].",
    artifact: [
      7, 7, 1, 4, 8,
      4, 8, 3, 0, 9
    ],
    tool_call_id: "123",
    name: "generateRandomInts",
    additional_kwargs: {},
    response_metadata: {}
  },
  lc_namespace: [ "langchain_core", "messages" ],
  content: "Successfully generated array of 10 random ints in [0, 9].",
  name: "generateRandomInts",
  additional_kwargs: {},
  response_metadata: {},
  id: undefined,
  tool_call_id: "123",
  artifact: [
    7, 7, 1, 4, 8,
    4, 8, 3, 0, 9
  ]
}

Related
You’ve now seen a few ways to create custom tools in LangChain.

Next, you might be interested in learning how to use a chat model to call tools.

You can also check out how to create your own custom versions of other modules.


How to force tool calling behavior
Prerequisites
This guide assumes familiarity with the following concepts:

Chat models
LangChain Tools
How to use a model to call tools
In order to force our LLM to select a specific tool, we can use the tool_choice parameter to ensure certain behavior. First, let’s define our model and tools:

import { tool } from "@langchain/core/tools";
import { z } from "zod";

const add = tool(
  (input) => {
    return `${input.a + input.b}`;
  },
  {
    name: "add",
    description: "Adds a and b.",
    schema: z.object({
      a: z.number(),
      b: z.number(),
    }),
  }
);

const multiply = tool(
  (input) => {
    return `${input.a * input.b}`;
  },
  {
    name: "Multiply",
    description: "Multiplies a and b.",
    schema: z.object({
      a: z.number(),
      b: z.number(),
    }),
  }
);

const tools = [add, multiply];

import { ChatOpenAI } from "@langchain/openai";

const llm = new ChatOpenAI({
  model: "gpt-3.5-turbo",
});

For example, we can force our tool to call the multiply tool by using the following code:

const llmForcedToMultiply = llm.bindTools(tools, {
  tool_choice: "Multiply",
});
const multiplyResult = await llmForcedToMultiply.invoke("what is 2 + 4");
console.log(JSON.stringify(multiplyResult.tool_calls, null, 2));

[
  {
    "name": "Multiply",
    "args": {
      "a": 2,
      "b": 4
    },
    "type": "tool_call",
    "id": "call_d5isFbUkn17Wjr6yEtNz7dDF"
  }
]

Even if we pass it something that doesn’t require multiplcation - it will still call the tool!

We can also just force our tool to select at least one of our tools by passing "any" (or for OpenAI models, the equivalent, "required") to the tool_choice parameter.

const llmForcedToUseTool = llm.bindTools(tools, {
  tool_choice: "any",
});
const anyToolResult = await llmForcedToUseTool.invoke("What day is today?");
console.log(JSON.stringify(anyToolResult.tool_calls, null, 2));

[
  {
    "name": "add",
    "args": {
      "a": 2,
      "b": 3
    },
    "type": "tool_call",
    "id": "call_La72g7Aj0XHG0pfPX6Dwg2vT"
  }
]



How to trim messages
Prerequisites
This guide assumes familiarity with the following concepts:

Messages
Chat models
Chaining
Chat history
The methods in this guide also require @langchain/core>=0.2.8. Please see here for a guide on upgrading.

All models have finite context windows, meaning there’s a limit to how many tokens they can take as input. If you have very long messages or a chain/agent that accumulates a long message is history, you’ll need to manage the length of the messages you’re passing in to the model.

The trimMessages util provides some basic strategies for trimming a list of messages to be of a certain token length.

Getting the last maxTokens tokens
To get the last maxTokens in the list of Messages we can set strategy: "last". Notice that for our tokenCounter we can pass in a function (more on that below) or a language model (since language models have a message token counting method). It makes sense to pass in a model when you’re trimming your messages to fit into the context window of that specific model:

import {
  AIMessage,
  HumanMessage,
  SystemMessage,
  trimMessages,
} from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";

const messages = [
  new SystemMessage("you're a good assistant, you always respond with a joke."),
  new HumanMessage("i wonder why it's called langchain"),
  new AIMessage(
    'Well, I guess they thought "WordRope" and "SentenceString" just didn\'t have the same ring to it!'
  ),
  new HumanMessage("and who is harrison chasing anyways"),
  new AIMessage(
    "Hmmm let me think.\n\nWhy, he's probably chasing after the last cup of coffee in the office!"
  ),
  new HumanMessage("what do you call a speechless parrot"),
];

const trimmed = await trimMessages(messages, {
  maxTokens: 45,
  strategy: "last",
  tokenCounter: new ChatOpenAI({ model: "gpt-4" }),
});

console.log(
  trimmed
    .map((x) =>
      JSON.stringify(
        {
          role: x._getType(),
          content: x.content,
        },
        null,
        2
      )
    )
    .join("\n\n")
);

{
  "role": "human",
  "content": "and who is harrison chasing anyways"
}

{
  "role": "ai",
  "content": "Hmmm let me think.\n\nWhy, he's probably chasing after the last cup of coffee in the office!"
}

{
  "role": "human",
  "content": "what do you call a speechless parrot"
}

If we want to always keep the initial system message we can specify includeSystem: true:

await trimMessages(messages, {
  maxTokens: 45,
  strategy: "last",
  tokenCounter: new ChatOpenAI({ model: "gpt-4" }),
  includeSystem: true,
});

[
  SystemMessage {
    lc_serializable: true,
    lc_kwargs: {
      content: "you're a good assistant, you always respond with a joke.",
      additional_kwargs: {},
      response_metadata: {}
    },
    lc_namespace: [ 'langchain_core', 'messages' ],
    content: "you're a good assistant, you always respond with a joke.",
    name: undefined,
    additional_kwargs: {},
    response_metadata: {},
    id: undefined
  },
  AIMessage {
    lc_serializable: true,
    lc_kwargs: {
      content: 'Hmmm let me think.\n' +
        '\n' +
        "Why, he's probably chasing after the last cup of coffee in the office!",
      tool_calls: [],
      invalid_tool_calls: [],
      additional_kwargs: {},
      response_metadata: {}
    },
    lc_namespace: [ 'langchain_core', 'messages' ],
    content: 'Hmmm let me think.\n' +
      '\n' +
      "Why, he's probably chasing after the last cup of coffee in the office!",
    name: undefined,
    additional_kwargs: {},
    response_metadata: {},
    id: undefined,
    tool_calls: [],
    invalid_tool_calls: [],
    usage_metadata: undefined
  },
  HumanMessage {
    lc_serializable: true,
    lc_kwargs: {
      content: 'what do you call a speechless parrot',
      additional_kwargs: {},
      response_metadata: {}
    },
    lc_namespace: [ 'langchain_core', 'messages' ],
    content: 'what do you call a speechless parrot',
    name: undefined,
    additional_kwargs: {},
    response_metadata: {},
    id: undefined
  }
]

If we want to allow splitting up the contents of a message we can specify allowPartial: true:

await trimMessages(messages, {
  maxTokens: 50,
  strategy: "last",
  tokenCounter: new ChatOpenAI({ model: "gpt-4" }),
  includeSystem: true,
  allowPartial: true,
});

[
  SystemMessage {
    lc_serializable: true,
    lc_kwargs: {
      content: "you're a good assistant, you always respond with a joke.",
      additional_kwargs: {},
      response_metadata: {}
    },
    lc_namespace: [ 'langchain_core', 'messages' ],
    content: "you're a good assistant, you always respond with a joke.",
    name: undefined,
    additional_kwargs: {},
    response_metadata: {},
    id: undefined
  },
  AIMessage {
    lc_serializable: true,
    lc_kwargs: {
      content: 'Hmmm let me think.\n' +
        '\n' +
        "Why, he's probably chasing after the last cup of coffee in the office!",
      tool_calls: [],
      invalid_tool_calls: [],
      additional_kwargs: {},
      response_metadata: {}
    },
    lc_namespace: [ 'langchain_core', 'messages' ],
    content: 'Hmmm let me think.\n' +
      '\n' +
      "Why, he's probably chasing after the last cup of coffee in the office!",
    name: undefined,
    additional_kwargs: {},
    response_metadata: {},
    id: undefined,
    tool_calls: [],
    invalid_tool_calls: [],
    usage_metadata: undefined
  },
  HumanMessage {
    lc_serializable: true,
    lc_kwargs: {
      content: 'what do you call a speechless parrot',
      additional_kwargs: {},
      response_metadata: {}
    },
    lc_namespace: [ 'langchain_core', 'messages' ],
    content: 'what do you call a speechless parrot',
    name: undefined,
    additional_kwargs: {},
    response_metadata: {},
    id: undefined
  }
]

If we need to make sure that our first message (excluding the system message) is always of a specific type, we can specify startOn:

await trimMessages(messages, {
  maxTokens: 60,
  strategy: "last",
  tokenCounter: new ChatOpenAI({ model: "gpt-4" }),
  includeSystem: true,
  startOn: "human",
});

[
  SystemMessage {
    lc_serializable: true,
    lc_kwargs: {
      content: "you're a good assistant, you always respond with a joke.",
      additional_kwargs: {},
      response_metadata: {}
    },
    lc_namespace: [ 'langchain_core', 'messages' ],
    content: "you're a good assistant, you always respond with a joke.",
    name: undefined,
    additional_kwargs: {},
    response_metadata: {},
    id: undefined
  },
  HumanMessage {
    lc_serializable: true,
    lc_kwargs: {
      content: 'and who is harrison chasing anyways',
      additional_kwargs: {},
      response_metadata: {}
    },
    lc_namespace: [ 'langchain_core', 'messages' ],
    content: 'and who is harrison chasing anyways',
    name: undefined,
    additional_kwargs: {},
    response_metadata: {},
    id: undefined
  },
  AIMessage {
    lc_serializable: true,
    lc_kwargs: {
      content: 'Hmmm let me think.\n' +
        '\n' +
        "Why, he's probably chasing after the last cup of coffee in the office!",
      tool_calls: [],
      invalid_tool_calls: [],
      additional_kwargs: {},
      response_metadata: {}
    },
    lc_namespace: [ 'langchain_core', 'messages' ],
    content: 'Hmmm let me think.\n' +
      '\n' +
      "Why, he's probably chasing after the last cup of coffee in the office!",
    name: undefined,
    additional_kwargs: {},
    response_metadata: {},
    id: undefined,
    tool_calls: [],
    invalid_tool_calls: [],
    usage_metadata: undefined
  },
  HumanMessage {
    lc_serializable: true,
    lc_kwargs: {
      content: 'what do you call a speechless parrot',
      additional_kwargs: {},
      response_metadata: {}
    },
    lc_namespace: [ 'langchain_core', 'messages' ],
    content: 'what do you call a speechless parrot',
    name: undefined,
    additional_kwargs: {},
    response_metadata: {},
    id: undefined
  }
]

Getting the first maxTokens tokens
We can perform the flipped operation of getting the first maxTokens by specifying strategy: "first":

await trimMessages(messages, {
  maxTokens: 45,
  strategy: "first",
  tokenCounter: new ChatOpenAI({ model: "gpt-4" }),
});

[
  SystemMessage {
    lc_serializable: true,
    lc_kwargs: {
      content: "you're a good assistant, you always respond with a joke.",
      additional_kwargs: {},
      response_metadata: {}
    },
    lc_namespace: [ 'langchain_core', 'messages' ],
    content: "you're a good assistant, you always respond with a joke.",
    name: undefined,
    additional_kwargs: {},
    response_metadata: {},
    id: undefined
  },
  HumanMessage {
    lc_serializable: true,
    lc_kwargs: {
      content: "i wonder why it's called langchain",
      additional_kwargs: {},
      response_metadata: {}
    },
    lc_namespace: [ 'langchain_core', 'messages' ],
    content: "i wonder why it's called langchain",
    name: undefined,
    additional_kwargs: {},
    response_metadata: {},
    id: undefined
  }
]

Writing a custom token counter
We can write a custom token counter function that takes in a list of messages and returns an int.

import { encodingForModel } from "@langchain/core/utils/tiktoken";
import {
  BaseMessage,
  HumanMessage,
  AIMessage,
  ToolMessage,
  SystemMessage,
  MessageContent,
  MessageContentText,
} from "@langchain/core/messages";

async function strTokenCounter(
  messageContent: MessageContent
): Promise<number> {
  if (typeof messageContent === "string") {
    return (await encodingForModel("gpt-4")).encode(messageContent).length;
  } else {
    if (messageContent.every((x) => x.type === "text" && x.text)) {
      return (await encodingForModel("gpt-4")).encode(
        (messageContent as MessageContentText[])
          .map(({ text }) => text)
          .join("")
      ).length;
    }
    throw new Error(
      `Unsupported message content ${JSON.stringify(messageContent)}`
    );
  }
}

async function tiktokenCounter(messages: BaseMessage[]): Promise<number> {
  let numTokens = 3; // every reply is primed with <|start|>assistant<|message|>
  const tokensPerMessage = 3;
  const tokensPerName = 1;

  for (const msg of messages) {
    let role: string;
    if (msg instanceof HumanMessage) {
      role = "user";
    } else if (msg instanceof AIMessage) {
      role = "assistant";
    } else if (msg instanceof ToolMessage) {
      role = "tool";
    } else if (msg instanceof SystemMessage) {
      role = "system";
    } else {
      throw new Error(`Unsupported message type ${msg.constructor.name}`);
    }

    numTokens +=
      tokensPerMessage +
      (await strTokenCounter(role)) +
      (await strTokenCounter(msg.content));

    if (msg.name) {
      numTokens += tokensPerName + (await strTokenCounter(msg.name));
    }
  }

  return numTokens;
}

await trimMessages(messages, {
  maxTokens: 45,
  strategy: "last",
  tokenCounter: tiktokenCounter,
});

[
  AIMessage {
    lc_serializable: true,
    lc_kwargs: {
      content: 'Hmmm let me think.\n' +
        '\n' +
        "Why, he's probably chasing after the last cup of coffee in the office!",
      tool_calls: [],
      invalid_tool_calls: [],
      additional_kwargs: {},
      response_metadata: {}
    },
    lc_namespace: [ 'langchain_core', 'messages' ],
    content: 'Hmmm let me think.\n' +
      '\n' +
      "Why, he's probably chasing after the last cup of coffee in the office!",
    name: undefined,
    additional_kwargs: {},
    response_metadata: {},
    id: undefined,
    tool_calls: [],
    invalid_tool_calls: [],
    usage_metadata: undefined
  },
  HumanMessage {
    lc_serializable: true,
    lc_kwargs: {
      content: 'what do you call a speechless parrot',
      additional_kwargs: {},
      response_metadata: {}
    },
    lc_namespace: [ 'langchain_core', 'messages' ],
    content: 'what do you call a speechless parrot',
    name: undefined,
    additional_kwargs: {},
    response_metadata: {},
    id: undefined
  }
]

Chaining
trimMessages can be used in an imperatively (like above) or declaratively, making it easy to compose with other components in a chain

import { ChatOpenAI } from "@langchain/openai";
import { trimMessages } from "@langchain/core/messages";

const llm = new ChatOpenAI({ model: "gpt-4o" });

// Notice we don't pass in messages. This creates
// a RunnableLambda that takes messages as input
const trimmer = trimMessages({
  maxTokens: 45,
  strategy: "last",
  tokenCounter: llm,
  includeSystem: true,
});

const chain = trimmer.pipe(llm);
await chain.invoke(messages);

AIMessage {
  lc_serializable: true,
  lc_kwargs: {
    content: 'Thanks! I do try to keep things light. But for a more serious answer, "LangChain" is likely named to reflect its focus on language processing and the way it connects different components or models together—essentially forming a "chain" of linguistic operations. The "Lang" part emphasizes its focus on language, while "Chain" highlights the interconnected workflows it aims to facilitate.',
    tool_calls: [],
    invalid_tool_calls: [],
    additional_kwargs: { function_call: undefined, tool_calls: undefined },
    response_metadata: {}
  },
  lc_namespace: [ 'langchain_core', 'messages' ],
  content: 'Thanks! I do try to keep things light. But for a more serious answer, "LangChain" is likely named to reflect its focus on language processing and the way it connects different components or models together—essentially forming a "chain" of linguistic operations. The "Lang" part emphasizes its focus on language, while "Chain" highlights the interconnected workflows it aims to facilitate.',
  name: undefined,
  additional_kwargs: { function_call: undefined, tool_calls: undefined },
  response_metadata: {
    tokenUsage: { completionTokens: 77, promptTokens: 59, totalTokens: 136 },
    finish_reason: 'stop'
  },
  id: undefined,
  tool_calls: [],
  invalid_tool_calls: [],
  usage_metadata: { input_tokens: 59, output_tokens: 77, total_tokens: 136 }
}


Looking at the LangSmith trace we can see that before the messages are passed to the model they are first trimmed.

Looking at just the trimmer, we can see that it’s a Runnable object that can be invoked like all Runnables:

await trimmer.invoke(messages);

[
  SystemMessage {
    lc_serializable: true,
    lc_kwargs: {
      content: "you're a good assistant, you always respond with a joke.",
      additional_kwargs: {},
      response_metadata: {}
    },
    lc_namespace: [ 'langchain_core', 'messages' ],
    content: "you're a good assistant, you always respond with a joke.",
    name: undefined,
    additional_kwargs: {},
    response_metadata: {},
    id: undefined
  },
  AIMessage {
    lc_serializable: true,
    lc_kwargs: {
      content: 'Hmmm let me think.\n' +
        '\n' +
        "Why, he's probably chasing after the last cup of coffee in the office!",
      tool_calls: [],
      invalid_tool_calls: [],
      additional_kwargs: {},
      response_metadata: {}
    },
    lc_namespace: [ 'langchain_core', 'messages' ],
    content: 'Hmmm let me think.\n' +
      '\n' +
      "Why, he's probably chasing after the last cup of coffee in the office!",
    name: undefined,
    additional_kwargs: {},
    response_metadata: {},
    id: undefined,
    tool_calls: [],
    invalid_tool_calls: [],
    usage_metadata: undefined
  },
  HumanMessage {
    lc_serializable: true,
    lc_kwargs: {
      content: 'what do you call a speechless parrot',
      additional_kwargs: {},
      response_metadata: {}
    },
    lc_namespace: [ 'langchain_core', 'messages' ],
    content: 'what do you call a speechless parrot',
    name: undefined,
    additional_kwargs: {},
    response_metadata: {},
    id: undefined
  }
]

Using with ChatMessageHistory
Trimming messages is especially useful when working with chat histories, which can get arbitrarily long:

import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import { RunnableWithMessageHistory } from "@langchain/core/runnables";
import { HumanMessage, trimMessages } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";

const chatHistory = new InMemoryChatMessageHistory(messages.slice(0, -1));

const dummyGetSessionHistory = async (sessionId: string) => {
  if (sessionId !== "1") {
    throw new Error("Session not found");
  }
  return chatHistory;
};

const llm = new ChatOpenAI({ model: "gpt-4o" });

const trimmer = trimMessages({
  maxTokens: 45,
  strategy: "last",
  tokenCounter: llm,
  includeSystem: true,
});

const chain = trimmer.pipe(llm);
const chainWithHistory = new RunnableWithMessageHistory({
  runnable: chain,
  getMessageHistory: dummyGetSessionHistory,
});
await chainWithHistory.invoke(
  [new HumanMessage("what do you call a speechless parrot")],
  { configurable: { sessionId: "1" } }
);

AIMessage {
  lc_serializable: true,
  lc_kwargs: {
    content: 'A "polly-no-want-a-cracker"!',
    tool_calls: [],
    invalid_tool_calls: [],
    additional_kwargs: { function_call: undefined, tool_calls: undefined },
    response_metadata: {}
  },
  lc_namespace: [ 'langchain_core', 'messages' ],
  content: 'A "polly-no-want-a-cracker"!',
  name: undefined,
  additional_kwargs: { function_call: undefined, tool_calls: undefined },
  response_metadata: {
    tokenUsage: { completionTokens: 11, promptTokens: 57, totalTokens: 68 },
    finish_reason: 'stop'
  },
  id: undefined,
  tool_calls: [],
  invalid_tool_calls: [],
  usage_metadata: { input_tokens: 57, output_tokens: 11, total_tokens: 68 }
}

Looking at the LangSmith trace we can see that we retrieve all of our messages but before the messages are passed to the model they are trimmed to be just the system message and last human message.

API reference
For a complete description of all arguments head to the API reference.


Messages
Prerequisites
Chat Models
Overview
Messages are the unit of communication in chat models. They are used to represent the input and output of a chat model, as well as any additional context or metadata that may be associated with a conversation.

Each message has a role (e.g., "user", "assistant"), content (e.g., text, multimodal data), and additional metadata that can vary depending on the chat model provider.

LangChain provides a unified message format that can be used across chat models, allowing users to work with different chat models without worrying about the specific details of the message format used by each model provider.

What inside a message?
A message typically consists of the following pieces of information:

Role: The role of the message (e.g., "user", "assistant").
Content: The content of the message (e.g., text, multimodal data).
Additional metadata: id, name, token usage and other model-specific metadata.
Role
Roles are used to distinguish between different types of messages in a conversation and help the chat model understand how to respond to a given sequence of messages.

Role	Description
system	Used to tell the chat model how to behave and provide additional context. Not supported by all chat model providers.
user	Represents input from a user interacting with the model, usually in the form of text or other interactive input.
assistant	Represents a response from the model, which can include text or a request to invoke tools.
tool	A message used to pass the results of a tool invocation back to the model after external data or processing has been retrieved. Used with chat models that support tool calling.
function (legacy)	This is a legacy role, corresponding to OpenAI's legacy function-calling API. tool role should be used instead.
Content
The content of a message text or an array of objects representing multimodal data (e.g., images, audio, video). The exact format of the content can vary between different chat model providers.

Currently, most chat models support text as the primary content type, with some models also supporting multimodal data. However, support for multimodal data is still limited across most chat model providers.

For more information see:

HumanMessage -- for content in the input from the user.
AIMessage -- for content in the response from the model.
Multimodality -- for more information on multimodal content.
Other Message Data
Depending on the chat model provider, messages can include other data such as:

ID: An optional unique identifier for the message.
Name: An optional name property which allows differentiate between different entities/speakers with the same role. Not all models support this!
Metadata: Additional information about the message, such as timestamps, token usage, etc.
Tool Calls: A request made by the model to call one or more tools> See tool calling for more information.
Conversation Structure
The sequence of messages into a chat model should follow a specific structure to ensure that the chat model can generate a valid response.

For example, a typical conversation structure might look like this:

User Message: "Hello, how are you?"
Assistant Message: "I'm doing well, thank you for asking."
User Message: "Can you tell me a joke?"
Assistant Message: "Sure! Why did the scarecrow win an award? Because he was outstanding in his field!"
Please read the chat history guide for more information on managing chat history and ensuring that the conversation structure is correct.

LangChain Messages
LangChain provides a unified message format that can be used across all chat models, allowing users to work with different chat models without worrying about the specific details of the message format used by each model provider.

LangChain messages are classes that subclass from a BaseMessage.

The five main message types are:

SystemMessage: corresponds to system role
HumanMessage: corresponds to user role
AIMessage: corresponds to assistant role
AIMessageChunk: corresponds to assistant role, used for streaming responses
ToolMessage: corresponds to tool role
Other important messages include:

RemoveMessage -- does not correspond to any role. This is an abstraction, mostly used in LangGraph to manage chat history.
Legacy FunctionMessage: corresponds to the function role in OpenAI's legacy function-calling API.
You can find more information about messages in the API Reference.

SystemMessage
A SystemMessage is used to prime the behavior of the AI model and provide additional context, such as instructing the model to adopt a specific persona or setting the tone of the conversation (e.g., "This is a conversation about cooking").

Different chat providers may support system message in one of the following ways:

Through a "system" message role: In this case, a system message is included as part of the message sequence with the role explicitly set as "system."
Through a separate API parameter for system instructions: Instead of being included as a message, system instructions are passed via a dedicated API parameter.
No support for system messages: Some models do not support system messages at all.
Most major chat model providers support system instructions via either a chat message or a separate API parameter. LangChain will automatically adapt based on the provider’s capabilities. If the provider supports a separate API parameter for system instructions, LangChain will extract the content of a system message and pass it through that parameter.

If no system message is supported by the provider, in most cases LangChain will attempt to incorporate the system message's content into a HumanMessage or raise an exception if that is not possible. However, this behavior is not yet consistently enforced across all implementations, and if using a less popular implementation of a chat model (e.g., an implementation from the @langchain/community package) it is recommended to check the specific documentation for that model.

HumanMessage
The HumanMessage corresponds to the "user" role. A human message represents input from a user interacting with the model.

Text Content
Most chat models expect the user input to be in the form of text.

import { HumanMessage } from "@langchain/core/messages";

await model.invoke([new HumanMessage("Hello, how are you?")]);

tip
When invoking a chat model with a string as input, LangChain will automatically convert the string into a HumanMessage object. This is mostly useful for quick testing.

await model.invoke("Hello, how are you?");

Multi-modal Content
Some chat models accept multimodal inputs, such as images, audio, video, or files like PDFs.

Please see the multimodality guide for more information.

AIMessage
AIMessage is used to represent a message with the role "assistant". This is the response from the model, which can include text or a request to invoke tools. It could also include other media types like images, audio, or video -- though this is still uncommon at the moment.

import { HumanMessage } from "@langchain/core/messages";

const aiMessage = await model.invoke([new HumanMessage("Tell me a joke")]);
console.log(aiMessage);

AIMessage({
  content: "Why did the chicken cross the road?\n\nTo get to the other side!",
  tool_calls: [],
  response_metadata: { ... },
  usage_metadata: { ... },
})

An AIMessage has the following attributes. The attributes which are standardized are the ones that LangChain attempts to standardize across different chat model providers. raw fields are specific to the model provider and may vary.

Attribute	Standardized/Raw	Description
content	Raw	Usually a string, but can be a list of content blocks. See content for details.
tool_calls	Standardized	Tool calls associated with the message. See tool calling for details.
invalid_tool_calls	Standardized	Tool calls with parsing errors associated with the message. See tool calling for details.
usage_metadata	Standardized	Usage metadata for a message, such as token counts. See Usage Metadata API Reference.
id	Standardized	An optional unique identifier for the message, ideally provided by the provider/model that created the message.
response_metadata	Raw	Response metadata, e.g., response headers, logprobs, token counts.
content
The content property of an AIMessage represents the response generated by the chat model.

The content is either:

text -- the norm for virtually all chat models.
A array of objects -- Each object represents a content block and is associated with a type.
Used by Anthropic for surfacing agent thought process when doing tool calling.
Used by OpenAI for audio outputs. Please see multi-modal content for more information.
info
The content property is not standardized across different chat model providers, mostly because there are still few examples to generalize from.

AIMessageChunk
It is common to stream responses for the chat model as they are being generated, so the user can see the response in real-time instead of waiting for the entire response to be generated before displaying it.

It is returned from the stream, and streamEvents methods of the chat model.

For example,

for await (const chunk of model.stream([
  new HumanMessage("what color is the sky?"),
])) {
  console.log(chunk);
}

AIMessageChunk follows nearly the same structure as AIMessage, but uses a different ToolCallChunk to be able to stream tool calling in a standardized manner.

Aggregating
<Type>MessageChunks have a concat method you can use, or you can import it. This is useful when you want to display the final response to the user.

const aiMessage = chunk1.concat(chunk2).concat(chunk3).concat(...);

or

import { concat } from "@langchain/core/utils/stream";
const aiMessage = concat(chunk1, chunk2);

ToolMessage
This represents a message with role "tool", which contains the result of calling a tool. In addition to role and content, this message has:

a tool_call_id field which conveys the id of the call to the tool that was called to produce this result.
an artifact field which can be used to pass along arbitrary artifacts of the tool execution which are useful to track but which should not be sent to the model.
Please see tool calling for more information.

RemoveMessage
This is a special message type that does not correspond to any roles. It is used for managing chat history in LangGraph.

Please see the following for more information on how to use the RemoveMessage:

Memory conceptual guide
How to delete messages
(Legacy) FunctionMessage
This is a legacy message type, corresponding to OpenAI's legacy function-calling API. ToolMessage should be used instead to correspond to the updated tool-calling API.

OpenAI Format
Inputs
Chat models also accept OpenAI's format as inputs to chat models:

await chatModel.invoke([
  {
    role: "user",
    content: "Hello, how are you?",
  },
  {
    role: "assistant",
    content: "I'm doing well, thank you for asking.",
  },
  {
    role: "user",
    content: "Can you tell me a joke?",
  },
]);

Outputs
At the moment, the output of the model will be in terms of LangChain messages, so you will need to convert the output to the OpenAI format if you need OpenAI format for the output as well.




LangChain.js@langchain/coremessagestrimMessages
Function trimMessages
trimMessages(options): Runnable<BaseMessage[], BaseMessage[]>
Trim messages to be below a token count.

Parameters
options: TrimMessagesFields
Trimming options.

Returns Runnable<BaseMessage[], BaseMessage[]>
An array of trimmed BaseMessages or a Runnable that takes a sequence of BaseMessage-like objects and returns an array of trimmed BaseMessages.

Throws
If two incompatible arguments are specified or an unrecognized strategy is specified.

Example
import { trimMessages, AIMessage, BaseMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";

const messages = [
  new SystemMessage("This is a 4 token text. The full message is 10 tokens."),
  new HumanMessage({
    content: "This is a 4 token text. The full message is 10 tokens.",
    id: "first",
  }),
  new AIMessage({
    content: [
      { type: "text", text: "This is the FIRST 4 token block." },
      { type: "text", text: "This is the SECOND 4 token block." },
    ],
    id: "second",
  }),
  new HumanMessage({
    content: "This is a 4 token text. The full message is 10 tokens.",
    id: "third",
  }),
  new AIMessage({
    content: "This is a 4 token text. The full message is 10 tokens.",
    id: "fourth",
  }),
];

function dummyTokenCounter(messages: BaseMessage[]): number {
  // treat each message like it adds 3 default tokens at the beginning
  // of the message and at the end of the message. 3 + 4 + 3 = 10 tokens
  // per message.

  const defaultContentLen = 4;
  const defaultMsgPrefixLen = 3;
  const defaultMsgSuffixLen = 3;

  let count = 0;
  for (const msg of messages) {
    if (typeof msg.content === "string") {
      count += defaultMsgPrefixLen + defaultContentLen + defaultMsgSuffixLen;
    }
    if (Array.isArray(msg.content)) {
      count +=
        defaultMsgPrefixLen +
        msg.content.length * defaultContentLen +
        defaultMsgSuffixLen;
    }
  }
  return count;
}
Copy
First 30 tokens, not allowing partial messages:

await trimMessages(messages, {
  maxTokens: 30,
  tokenCounter: dummyTokenCounter,
  strategy: "first",
});
Copy
Output:

[
  new SystemMessage(
    "This is a 4 token text. The full message is 10 tokens."
  ),
  new HumanMessage({
    content: "This is a 4 token text. The full message is 10 tokens.",
    id: "first",
  }),
]
Copy
First 30 tokens, allowing partial messages:

await trimMessages(messages, {
  maxTokens: 30,
  tokenCounter: dummyTokenCounter,
  strategy: "first",
  allowPartial: true,
});
Copy
Output:

[
  new SystemMessage(
    "This is a 4 token text. The full message is 10 tokens."
  ),
  new HumanMessage({
    content: "This is a 4 token text. The full message is 10 tokens.",
    id: "first",
  }),
  new AIMessage({
    content: [{ type: "text", text: "This is the FIRST 4 token block." }],
    id: "second",
  }),
]
Copy
First 30 tokens, allowing partial messages, have to end on HumanMessage:

await trimMessages(messages, {
  maxTokens: 30,
  tokenCounter: dummyTokenCounter,
  strategy: "first",
  allowPartial: true,
  endOn: "human",
});
Copy
Output:

[
  new SystemMessage(
    "This is a 4 token text. The full message is 10 tokens."
  ),
  new HumanMessage({
    content: "This is a 4 token text. The full message is 10 tokens.",
    id: "first",
  }),
]
Copy
Last 30 tokens, including system message, not allowing partial messages:

await trimMessages(messages, {
  maxTokens: 30,
  includeSystem: true,
  tokenCounter: dummyTokenCounter,
  strategy: "last",
});
Copy
Output:

[
  new SystemMessage(
    "This is a 4 token text. The full message is 10 tokens."
  ),
  new HumanMessage({
    content: "This is a 4 token text. The full message is 10 tokens.",
    id: "third",
  }),
  new AIMessage({
    content: "This is a 4 token text. The full message is 10 tokens.",
    id: "fourth",
  }),
]
Copy
Last 40 tokens, including system message, allowing partial messages:

await trimMessages(messages, {
  maxTokens: 40,
  tokenCounter: dummyTokenCounter,
  strategy: "last",
  allowPartial: true,
  includeSystem: true,
});
Copy
Output:

[
  new SystemMessage(
    "This is a 4 token text. The full message is 10 tokens."
  ),
  new AIMessage({
    content: [{ type: "text", text: "This is the FIRST 4 token block." }],
    id: "second",
  }),
  new HumanMessage({
    content: "This is a 4 token text. The full message is 10 tokens.",
    id: "third",
  }),
  new AIMessage({
    content: "This is a 4 token text. The full message is 10 tokens.",
    id: "fourth",
  }),
]
Copy
Last 30 tokens, including system message, allowing partial messages, end on HumanMessage:

await trimMessages(messages, {
  maxTokens: 30,
  tokenCounter: dummyTokenCounter,
  strategy: "last",
  endOn: "human",
  includeSystem: true,
  allowPartial: true,
});
Copy
Output:

[
  new SystemMessage(
    "This is a 4 token text. The full message is 10 tokens."
  ),
  new AIMessage({
    content: [{ type: "text", text: "This is the FIRST 4 token block." }],
    id: "second",
  }),
  new HumanMessage({
    content: "This is a 4 token text. The full message is 10 tokens.",
    id: "third",
  }),
]
Copy
Last 40 tokens, including system message, allowing partial messages, start on HumanMessage:

await trimMessages(messages, {
  maxTokens: 40,
  tokenCounter: dummyTokenCounter,
  strategy: "last",
  includeSystem: true,
  allowPartial: true,
  startOn: "human",
});
Copy
Output:

[
  new SystemMessage(
    "This is a 4 token text. The full message is 10 tokens."
  ),
  new HumanMessage({
    content: "This is a 4 token text. The full message is 10 tokens.",
    id: "third",
  }),
  new AIMessage({
    content: "This is a 4 token text. The full message is 10 tokens.",
    id: "fourth",
  }),
]
Copy
Defined in langchain-core/src/messages/transformers.ts:626
trimMessages(messages, options): Promise<BaseMessage[]>
Parameters
messages: BaseMessage[]
options: TrimMessagesFields
Returns Promise<BaseMessage[]>



How to chain runnables
One point about LangChain Expression Language is that any two runnables can be “chained” together into sequences. The output of the previous runnable’s .invoke() call is passed as input to the next runnable. This can be done using the .pipe() method.

The resulting RunnableSequence is itself a runnable, which means it can be invoked, streamed, or further chained just like any other runnable. Advantages of chaining runnables in this way are efficient streaming (the sequence will stream output as soon as it is available), and debugging and tracing with tools like LangSmith.

Prerequisites
This guide assumes familiarity with the following concepts:

LangChain Expression Language (LCEL)
Prompt templates
Chat models
Output parser
The pipe method
To show off how this works, let’s go through an example. We’ll walk through a common pattern in LangChain: using a prompt template to format input into a chat model, and finally converting the chat message output into a string with an output parser.

Pick your chat model:
Groq
OpenAI
Anthropic
Google Gemini
FireworksAI
MistralAI
VertexAI
Install dependencies
tip
See this section for general instructions on installing integration packages.

npm
yarn
pnpm
pnpm add @langchain/groq 

Add environment variables
GROQ_API_KEY=your-api-key

Instantiate the model
import { ChatGroq } from "@langchain/groq";

const model = new ChatGroq({
  model: "llama-3.3-70b-versatile",
  temperature: 0
});

tip
See this section for general instructions on installing integration packages.

npm
yarn
pnpm
pnpm add langchain @langchain/core

import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";

const prompt = ChatPromptTemplate.fromTemplate("tell me a joke about {topic}");

const chain = prompt.pipe(model).pipe(new StringOutputParser());

Prompts and models are both runnable, and the output type from the prompt call is the same as the input type of the chat model, so we can chain them together. We can then invoke the resulting sequence like any other runnable:

await chain.invoke({ topic: "bears" });

"Here's a bear joke for you:\n\nWhy did the bear dissolve in water?\nBecause it was a polar bear!"

Coercion
We can even combine this chain with more runnables to create another chain. This may involve some input/output formatting using other types of runnables, depending on the required inputs and outputs of the chain components.

For example, let’s say we wanted to compose the joke generating chain with another chain that evaluates whether or not the generated joke was funny.

We would need to be careful with how we format the input into the next chain. In the below example, the dict in the chain is automatically parsed and converted into a RunnableParallel, which runs all of its values in parallel and returns a dict with the results.

This happens to be the same format the next prompt template expects. Here it is in action:

import { RunnableLambda } from "@langchain/core/runnables";

const analysisPrompt = ChatPromptTemplate.fromTemplate(
  "is this a funny joke? {joke}"
);

const composedChain = new RunnableLambda({
  func: async (input: { topic: string }) => {
    const result = await chain.invoke(input);
    return { joke: result };
  },
})
  .pipe(analysisPrompt)
  .pipe(model)
  .pipe(new StringOutputParser());

await composedChain.invoke({ topic: "bears" });

'Haha, that\'s a clever play on words! Using "polar" to imply the bear dissolved or became polar/polarized when put in water. Not the most hilarious joke ever, but it has a cute, groan-worthy pun that makes it mildly amusing. I appreciate a good pun or wordplay joke.'


Functions will also be coerced into runnables, so you can add custom logic to your chains too. The below chain results in the same logical flow as before:

import { RunnableSequence } from "@langchain/core/runnables";

const composedChainWithLambda = RunnableSequence.from([
  chain,
  (input) => ({ joke: input }),
  analysisPrompt,
  model,
  new StringOutputParser(),
]);

await composedChainWithLambda.invoke({ topic: "beets" });

"Haha, that's a cute and punny joke! I like how it plays on the idea of beets blushing or turning red like someone blushing. Food puns can be quite amusing. While not a total knee-slapper, it's a light-hearted, groan-worthy dad joke that would make me chuckle and shake my head. Simple vegetable humor!"


See the LangSmith trace for the run above here

However, keep in mind that using functions like this may interfere with operations like streaming. See this section for more information.

Next steps
You now know some ways to chain two runnables together.

To learn more, see the other how-to guides on runnables in this section.


Chat history
Prerequisites
Messages
Chat models
Tool calling
Chat history is a record of the conversation between the user and the chat model. It is used to maintain context and state throughout the conversation. The chat history is sequence of messages, each of which is associated with a specific role, such as "user", "assistant", "system", or "tool".

Conversation patterns
Conversation patterns

Most conversations start with a system message that sets the context for the conversation. This is followed by a user message containing the user's input, and then an assistant message containing the model's response.

The assistant may respond directly to the user or if configured with tools request that a tool be invoked to perform a specific task.

So a full conversation often involves a combination of two patterns of alternating messages:

The user and the assistant representing a back-and-forth conversation.
The assistant and tool messages representing an "agentic" workflow where the assistant is invoking tools to perform specific tasks.
Managing chat history
Since chat models have a maximum limit on input size, it's important to manage chat history and trim it as needed to avoid exceeding the context window.

While processing chat history, it's essential to preserve a correct conversation structure.

Key guidelines for managing chat history:

The conversation should follow one of these structures:
The first message is either a "user" message or a "system" message, followed by a "user" and then an "assistant" message.
The last message should be either a "user" message or a "tool" message containing the result of a tool call.
When using tool calling, a "tool" message should only follow an "assistant" message that requested the tool invocation.
tip
Understanding correct conversation structure is essential for being able to properly implement memory in chat models.

Related resources
How to trim messages
Memory guide for information on implementing short-term and long-term memory in chat models using LangGraph.



Memory¶
What is Memory?¶
Memory in AI applications refers to the ability to process, store, and effectively recall information from past interactions. With memory, your agents can learn from feedback and adapt to users' preferences. This guide is divided into two sections based on the scope of memory recall: short-term memory and long-term memory.

Short-term memory, or thread-scoped memory, can be recalled at any time from within a single conversational thread with a user. LangGraph manages short-term memory as a part of your agent's state. State is persisted to a database using a checkpointer so the thread can be resumed at any time. Short-term memory updates when the graph is invoked or a step is completed, and the State is read at the start of each step.

Long-term memory is shared across conversational threads. It can be recalled at any time and in any thread. Memories are scoped to any custom namespace, not just within a single thread ID. LangGraph provides stores (reference doc) to let you save and recall long-term memories.

Both are important to understand and implement for your application.



Short-term memory¶
Short-term memory lets your application remember previous interactions within a single thread or conversation. A thread organizes multiple interactions in a session, similar to the way email groups messages in a single conversation.

LangGraph manages short-term memory as part of the agent's state, persisted via thread-scoped checkpoints. This state can normally include the conversation history along with other stateful data, such as uploaded files, retrieved documents, or generated artifacts. By storing these in the graph's state, the bot can access the full context for a given conversation while maintaining separation between different threads.

Since conversation history is the most common form of representing short-term memory, in the next section, we will cover techniques for managing conversation history when the list of messages becomes long. If you want to stick to the high-level concepts, continue on to the long-term memory section.

Managing long conversation history¶
Long conversations pose a challenge to today's LLMs. The full history may not even fit inside an LLM's context window, resulting in an irrecoverable error. Even if your LLM technically supports the full context length, most LLMs still perform poorly over long contexts. They get "distracted" by stale or off-topic content, all while suffering from slower response times and higher costs.

Managing short-term memory is an exercise of balancing precision & recall with your application's other performance requirements (latency & cost). As always, it's important to think critically about how you represent information for your LLM and to look at your data. We cover a few common techniques for managing message lists below and hope to provide sufficient context for you to pick the best tradeoffs for your application:

Editing message lists: How to think about trimming and filtering a list of messages before passing to language model.
Summarizing past conversations: A common technique to use when you don't just want to filter the list of messages.
Editing message lists¶
Chat models accept context using messages, which include developer provided instructions (a system message) and user inputs (human messages). In chat applications, messages alternate between human inputs and model responses, resulting in a list of messages that grows longer over time. Because context windows are limited and token-rich message lists can be costly, many applications can benefit from using techniques to manually remove or forget stale information.



The most direct approach is to remove old messages from a list (similar to a least-recently used cache).

The typical technique for deleting content from a list in LangGraph is to return an update from a node telling the system to delete some portion of the list. You get to define what this update looks like, but a common approach would be to let you return an object or dictionary specifying which values to retain.


import { Annotation } from "@langchain/langgraph";

const StateAnnotation = Annotation.Root({
  myList: Annotation<any[]>({
    reducer: (
      existing: string[],
      updates: string[] | { type: string; from: number; to?: number }
    ) => {
      if (Array.isArray(updates)) {
        // Normal case, add to the history
        return [...existing, ...updates];
      } else if (typeof updates === "object" && updates.type === "keep") {
        // You get to decide what this looks like.
        // For example, you could simplify and just accept a string "DELETE"
        // and clear the entire list.
        return existing.slice(updates.from, updates.to);
      }
      // etc. We define how to interpret updates
      return existing;
    },
    default: () => [],
  }),
});

type State = typeof StateAnnotation.State;

function myNode(state: State) {
  return {
    // We return an update for the field "myList" saying to
    // keep only values from index -5 to the end (deleting the rest)
    myList: { type: "keep", from: -5, to: undefined },
  };
}
LangGraph will call the "reducer" function any time an update is returned under the key "myList". Within that function, we define what types of updates to accept. Typically, messages will be added to the existing list (the conversation will grow); however, we've also added support to accept a dictionary that lets you "keep" certain parts of the state. This lets you programmatically drop old message context.

Another common approach is to let you return a list of "remove" objects that specify the IDs of all messages to delete. If you're using the LangChain messages and the messagesStateReducer reducer (or MessagesAnnotation, which uses the same underlying functionality) in LangGraph, you can do this using a RemoveMessage.


import { RemoveMessage, AIMessage } from "@langchain/core/messages";
import { MessagesAnnotation } from "@langchain/langgraph";

type State = typeof MessagesAnnotation.State;

function myNode1(state: State) {
  // Add an AI message to the `messages` list in the state
  return { messages: [new AIMessage({ content: "Hi" })] };
}

function myNode2(state: State) {
  // Delete all but the last 2 messages from the `messages` list in the state
  const deleteMessages = state.messages
    .slice(0, -2)
    .map((m) => new RemoveMessage({ id: m.id }));
  return { messages: deleteMessages };
}
In the example above, the MessagesAnnotation allows us to append new messages to the messages state key as shown in myNode1. When it sees a RemoveMessage, it will delete the message with that ID from the list (and the RemoveMessage will then be discarded). For more information on LangChain-specific message handling, check out this how-to on using RemoveMessage.

See this how-to guidefor example usage.

Summarizing past conversations¶
The problem with trimming or removing messages, as shown above, is that we may lose information from culling of the message queue. Because of this, some applications benefit from a more sophisticated approach of summarizing the message history using a chat model.



Simple prompting and orchestration logic can be used to achieve this. As an example, in LangGraph we can extend the MessagesAnnotation to include a summary key.


import { MessagesAnnotation, Annotation } from "@langchain/langgraph";

const MyGraphAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  summary: Annotation<string>,
});
Then, we can generate a summary of the chat history, using any existing summary as context for the next summary. This summarizeConversation node can be called after some number of messages have accumulated in the messages state key.


import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, RemoveMessage } from "@langchain/core/messages";

type State = typeof MyGraphAnnotation.State;

async function summarizeConversation(state: State) {
  // First, we get any existing summary
  const summary = state.summary || "";

  // Create our summarization prompt
  let summaryMessage: string;
  if (summary) {
    // A summary already exists
    summaryMessage =
      `This is a summary of the conversation to date: ${summary}\n\n` +
      "Extend the summary by taking into account the new messages above:";
  } else {
    summaryMessage = "Create a summary of the conversation above:";
  }

  // Add prompt to our history
  const messages = [
    ...state.messages,
    new HumanMessage({ content: summaryMessage }),
  ];

  // Assuming you have a ChatOpenAI model instance
  const model = new ChatOpenAI();
  const response = await model.invoke(messages);

  // Delete all but the 2 most recent messages
  const deleteMessages = state.messages
    .slice(0, -2)
    .map((m) => new RemoveMessage({ id: m.id }));

  return {
    summary: response.content,
    messages: deleteMessages,
  };
}
See this how-to here for example usage.

Knowing when to remove messages¶
Most LLMs have a maximum supported context window (denominated in tokens). A simple way to decide when to truncate messages is to count the tokens in the message history and truncate whenever it approaches that limit. Naive truncation is straightforward to implement on your own, though there are a few "gotchas". Some model APIs further restrict the sequence of message types (must start with human message, cannot have consecutive messages of the same type, etc.). If you're using LangChain, you can use the trimMessages utility and specify the number of tokens to keep from the list, as well as the strategy (e.g., keep the last maxTokens) to use for handling the boundary.

Below is an example.


import { trimMessages } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";

trimMessages(messages, {
  // Keep the last <= n_count tokens of the messages.
  strategy: "last",
  // Remember to adjust based on your model
  // or else pass a custom token_encoder
  tokenCounter: new ChatOpenAI({ modelName: "gpt-4" }),
  // Remember to adjust based on the desired conversation
  // length
  maxTokens: 45,
  // Most chat models expect that chat history starts with either:
  // (1) a HumanMessage or
  // (2) a SystemMessage followed by a HumanMessage
  startOn: "human",
  // Most chat models expect that chat history ends with either:
  // (1) a HumanMessage or
  // (2) a ToolMessage
  endOn: ["human", "tool"],
  // Usually, we want to keep the SystemMessage
  // if it's present in the original history.
  // The SystemMessage has special instructions for the model.
  includeSystem: true,
});
Long-term memory¶
Long-term memory in LangGraph allows systems to retain information across different conversations or sessions. Unlike short-term memory, which is thread-scoped, long-term memory is saved within custom "namespaces."

LangGraph stores long-term memories as JSON documents in a store (reference doc). Each memory is organized under a custom namespace (similar to a folder) and a distinct key (like a filename). Namespaces often include user or org IDs or other labels that make it easier to organize information. This structure enables hierarchical organization of memories. Cross-namespace searching is then supported through content filters. See the example below for an example.


import { InMemoryStore } from "@langchain/langgraph";

// InMemoryStore saves data to an in-memory dictionary. Use a DB-backed store in production use.
const store = new InMemoryStore();
const userId = "my-user";
const applicationContext = "chitchat";
const namespace = [userId, applicationContext];
await store.put(namespace, "a-memory", {
  rules: [
    "User likes short, direct language",
    "User only speaks English & TypeScript",
  ],
  "my-key": "my-value",
});
// get the "memory" by ID
const item = await store.get(namespace, "a-memory");
// list "memories" within this namespace, filtering on content equivalence
const items = await store.search(namespace, {
  filter: { "my-key": "my-value" },
});
When adding long-term memory to your agent, it's important to think about how to write memories, how to store and manage memory updates, and how to recall & represent memories for the LLM in your application. These questions are all interdependent: how you want to recall & format memories for the LLM dictates what you should store and how to manage it. Furthermore, each technique has tradeoffs. The right approach for you largely depends on your application's needs. LangGraph aims to give you the low-level primitives to directly control the long-term memory of your application, based on memory Store's.

Long-term memory is far from a solved problem. While it is hard to provide generic advice, we have provided a few reliable patterns below for your consideration as you implement long-term memory.

Do you want to write memories "on the hot path" or "in the background"

Memory can be updated either as part of your primary application logic (e.g. "on the hot path" of the application) or as a background task (as a separate function that generates memories based on the primary application's state). We document some tradeoffs for each approach in the writing memories section below.

Do you want to manage memories as a single profile or as a collection of documents?

We provide two main approaches to managing long-term memory: a single, continuously updated document (referred to as a "profile" or "schema") or a collection of documents. Each method offers its own benefits, depending on the type of information you need to store and how you intend to access it.

Managing memories as a single, continuously updated "profile" or "schema" is useful when there is well-scoped, specific information you want to remember about a user, organization, or other entity (including the agent itself). You can define the schema of the profile ahead of time, and then use an LLM to update this based on interactions. Querying the "memory" is easy since it's a simple GET operation on a JSON document. We explain this in more detail in remember a profile. This technique can provide higher precision (on known information use cases) at the expense of lower recall (since you have to anticipate and model your domain, and updates to the doc tend to delete or rewrite away old information at a greater frequency).

Managing long-term memory as a collection of documents, on the other hand, lets you store an unbounded amount of information. This technique is useful when you want to repeatedly extract & remember items over a long time horizon but can be more complicated to query and manage over time. Similar to the "profile" memory, you still define schema(s) for each memory. Rather than overwriting a single document, you instead will insert new ones (and potentially update or re-contextualize existing ones in the process). We explain this approach in more detail in "managing a collection of memories".

Do you want to present memories to your agent as updated instructions or as few-shot examples?

Memories are typically provided to the LLM as a part of the system prompt. Some common ways to "frame" memories for the LLM include providing raw information as "memories from previous interactions with user A", as system instructions or rules, or as few-shot examples.

Framing memories as "learning rules or instructions" typically means dedicating a portion of the system prompt to instructions the LLM can manage itself. After each conversation, you can prompt the LLM to evaluate its performance and update the instructions to better handle this type of task in the future. We explain this approach in more detail in this section.

Storing memories as few-shot examples lets you store and manage instructions as cause and effect. Each memory stores an input or context and expected response. Including a reasoning trajectory (a chain-of-thought) can also help provide sufficient context so that the memory is less likely to be mis-used in the future. We elaborate on this concept more in this section.

We will expand on techniques for writing, managing, and recalling & formatting memories in the following section.

Writing memories¶
Humans form long-term memories when we sleep, but when and how should our agents create new memories? The two most common ways we see agents write memories are "on the hot path" and "in the background".

Writing memories in the hot path¶
This involves creating memories while the application is running. To provide a popular production example, ChatGPT manages memories using a "save_memories" tool to upsert memories as content strings. It decides whether (and how) to use this tool every time it receives a user message and multi-tasks memory management with the rest of the user instructions.

This has a few benefits. First of all, it happens "in real time". If the user starts a new thread right away that memory will be present. The user also transparently sees when memories are stored, since the bot has to explicitly decide to store information and can relate that to the user.

This also has several downsides. It complicates the decisions the agent must make (what to commit to memory). This complication can degrade its tool-calling performance and reduce task completion rates. It will slow down the final response since it needs to decide what to commit to memory. It also typically leads to fewer things being saved to memory (since the assistant is multi-tasking), which will cause lower recall in later conversations.

Writing memories in the background¶
This involves updating memory as a conceptually separate task, typically as a completely separate graph or function. Since it happens in the background, it incurs no latency. It also splits up the application logic from the memory logic, making it more modular and easy to manage. It also lets you separate the timing of memory creation, letting you avoid redundant work. Your agent can focus on accomplishing its immediate task without having to consciously think about what it needs to remember.

This approach is not without its downsides, however. You have to think about how often to write memories. If it doesn't run in realtime, the user's interactions on other threads won't benefit from the new context. You also have to think about when to trigger this job. We typically recommend scheduling memories after some point of time, cancelling and re-scheduling for the future if new events occur on a given thread. Other popular choices are to form memories on some cron schedule or to let the user or application logic manually trigger memory formation.

Managing memories¶
Once you've sorted out memory scheduling, it's important to think about how to update memory with new information.

There are two main approaches: you can either continuously update a single document (memory profile) or insert new documents each time you receive new information.

We will outline some tradeoffs between these two approaches below, understanding that most people will find it most appropriate to combine approaches and to settle somewhere in the middle.

Manage individual profiles¶
A profile is generally just a JSON document with various key-value pairs you've selected to represent your domain. When remembering a profile, you will want to make sure that you are updating the profile each time. As a result, you will want to pass in the previous profile and ask the LLM to generate a new profile (or some JSON patch to apply to the old profile).

The larger the document, the more error-prone this can become. If your document becomes too large, you may want to consider splitting up the profiles into separate sections. You will likely need to use generation with retries and/or strict decoding when generating documents to ensure the memory schemas remains valid.

Manage a collection of memories¶
Saving memories as a collection of documents simplifies some things. Each individual memory can be more narrowly scoped and easier to generate. It also means you're less likely to lose information over time, since it's easier for an LLM to generate new objects for new information than it is for it to reconcile that new information with information in a dense profile. This tends to lead to higher recall downstream.

This approach shifts some complexity to how you prompt the LLM to apply memory updates. You now have to enable the LLM to delete or update existing items in the list. This can be tricky to prompt the LLM to do. Some LLMs may default to over-inserting; others may default to over-updating. Tuning the behavior here is best done through evals, something you can do with a tool like LangSmith.

This also shifts complexity to memory search (recall). You have to think about what relevant items to use. Right now we support filtering by metadata. We will be adding semantic search shortly.

Finally, this shifts some complexity to how you represent the memories for the LLM (and by extension, the schemas you use to save each memories). It's very easy to write memories that can easily be mistaken out-of-context. It's important to prompt the LLM to include all necessary contextual information in the given memory so that when you use it in later conversations it doesn't mistakenly mis-apply that information.

Representing memories¶
Once you have saved memories, the way you then retrieve and present the memory content for the LLM can play a large role in how well your LLM incorporates that information in its responses. The following sections present a couple of common approaches. Note that these sections also will largely inform how you write and manage memories. Everything in memory is connected!

Update own instructions¶
While instructions are often static text written by the developer, many AI applications benefit from letting the users personalize the rules and instructions the agent should follow whenever it interacts with that user. This ideally can be inferred by its interactions with the user (so the user doesn't have to explicitly change settings in your app). In this sense, instructions are a form of long-form memory!

One way to apply this is using "reflection" or "Meta-prompting" steps. Prompt the LLM with the current instruction set (from the system prompt) and a conversation with the user, and instruct the LLM to refine its instructions. This approach allows the system to dynamically update and improve its own behavior, potentially leading to better performance on various tasks. This is particularly useful for tasks where the instructions are challenging to specify a priori.

Meta-prompting uses past information to refine prompts. For instance, a Tweet generator employs meta-prompting to enhance its paper summarization prompt for Twitter. You could implement this using LangGraph's memory store to save updated instructions in a shared namespace. In this case, we will namespace the memories as "agent_instructions" and key the memory based on the agent.


import { BaseStore } from "@langchain/langgraph/store";
import { State } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";

// Node that *uses* the instructions
const callModel = async (state: State, store: BaseStore) => {
  const namespace = ["agent_instructions"];
  const instructions = await store.get(namespace, "agent_a");
  // Application logic
  const prompt = promptTemplate.format({
    instructions: instructions[0].value.instructions,
  });
  // ... rest of the logic
};

// Node that updates instructions
const updateInstructions = async (state: State, store: BaseStore) => {
  const namespace = ["instructions"];
  const currentInstructions = await store.search(namespace);
  // Memory logic
  const prompt = promptTemplate.format({
    instructions: currentInstructions[0].value.instructions,
    conversation: state.messages,
  });
  const llm = new ChatOpenAI();
  const output = await llm.invoke(prompt);
  const newInstructions = output.content; // Assuming the LLM returns the new instructions
  await store.put(["agent_instructions"], "agent_a", {
    instructions: newInstructions,
  });
  // ... rest of the logic
};
Few-shot examples¶
Sometimes it's easier to "show" than "tell." LLMs learn well from examples. Few-shot learning lets you "program" your LLM by updating the prompt with input-output examples to illustrate the intended behavior. While various best-practices can be used to generate few-shot examples, often the challenge lies in selecting the most relevant examples based on user input.

Note that the memory store is just one way to store data as few-shot examples. If you want to have more developer involvement, or tie few-shots more closely to your evaluation harness, you can also use a LangSmith Dataset to store your data. Then dynamic few-shot example selectors can be used out-of-the box to achieve this same goal. LangSmith will index the dataset for you and enable retrieval of few shot examples that are most relevant to the user input based upon keyword similarity (using a BM25-like algorithm for keyword based similarity).

See this how-to video for example usage of dynamic few-shot example selection in LangSmith. Also, see this blog post showcasing few-shot prompting to improve tool calling performance and this blog post using few-shot example to align an LLMs to human preferences.




How to add chat history
This tutorial previously built a chatbot using RunnableWithMessageHistory. You can access this version of the tutorial in the v0.2 docs.

The LangGraph implementation offers a number of advantages over RunnableWithMessageHistory, including the ability to persist arbitrary components of an application’s state (instead of only messages).

In many Q&A applications we want to allow the user to have a back-and-forth conversation, meaning the application needs some sort of “memory” of past questions and answers, and some logic for incorporating those into its current thinking.

In this guide we focus on adding logic for incorporating historical messages.

This is largely a condensed version of the Conversational RAG tutorial.

We will cover two approaches:

Chains, in which we always execute a retrieval step;
Agents, in which we give an LLM discretion over whether and how to execute a retrieval step (or multiple steps).
For the external knowledge source, we will use the same LLM Powered Autonomous Agents blog post by Lilian Weng from the RAG tutorial.

Setup
Dependencies
We’ll use an OpenAI chat model and embeddings and a Memory vector store in this walkthrough, but everything shown here works with any ChatModel or LLM, Embeddings, and VectorStore or Retriever.

We’ll use the following packages:

npm install --save langchain @langchain/openai langchain cheerio uuid

We need to set environment variable OPENAI_API_KEY:

export OPENAI_API_KEY=YOUR_KEY

LangSmith
Many of the applications you build with LangChain will contain multiple steps with multiple invocations of LLM calls. As these applications get more and more complex, it becomes crucial to be able to inspect what exactly is going on inside your chain or agent. The best way to do this is with LangSmith.

Note that LangSmith is not needed, but it is helpful. If you do want to use LangSmith, after you sign up at the link above, make sure to set your environment variables to start logging traces:

export LANGSMITH_TRACING=true
export LANGSMITH_API_KEY=YOUR_KEY

# Reduce tracing latency if you are not in a serverless environment
# export LANGCHAIN_CALLBACKS_BACKGROUND=true

Chains
In a conversational RAG application, queries issued to the retriever should be informed by the context of the conversation. LangChain provides a createHistoryAwareRetriever constructor to simplify this. It constructs a chain that accepts keys input and chat_history as input, and has the same output schema as a retriever. createHistoryAwareRetriever requires as inputs:

LLM;
Retriever;
Prompt.
First we obtain these objects:

LLM
We can use any supported chat model:

Pick your chat model:
Groq
OpenAI
Anthropic
Google Gemini
FireworksAI
MistralAI
VertexAI
Install dependencies
tip
See this section for general instructions on installing integration packages.

npm
yarn
pnpm
pnpm add @langchain/groq 

Add environment variables
GROQ_API_KEY=your-api-key

Instantiate the model
import { ChatGroq } from "@langchain/groq";

const llm = new ChatGroq({
  model: "llama-3.3-70b-versatile",
  temperature: 0
});

Initial setup
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings } from "@langchain/openai";

const loader = new CheerioWebBaseLoader(
  "https://lilianweng.github.io/posts/2023-06-23-agent/"
);

const docs = await loader.load();

const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});
const splits = await textSplitter.splitDocuments(docs);
const vectorStore = await MemoryVectorStore.fromDocuments(
  splits,
  new OpenAIEmbeddings()
);

// Retrieve and generate using the relevant snippets of the blog.
const retriever = vectorStore.asRetriever();

Prompt
We’ll use a prompt that includes a MessagesPlaceholder variable under the name “chat_history”. This allows us to pass in a list of Messages to the prompt using the “chat_history” input key, and these messages will be inserted after the system message and before the human message containing the latest question.

import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";

const contextualizeQSystemPrompt =
  "Given a chat history and the latest user question " +
  "which might reference context in the chat history, " +
  "formulate a standalone question which can be understood " +
  "without the chat history. Do NOT answer the question, " +
  "just reformulate it if needed and otherwise return it as is.";

const contextualizeQPrompt = ChatPromptTemplate.fromMessages([
  ["system", contextualizeQSystemPrompt],
  new MessagesPlaceholder("chat_history"),
  ["human", "{input}"],
]);

Assembling the chain
We can then instantiate the history-aware retriever:

import { createHistoryAwareRetriever } from "langchain/chains/history_aware_retriever";

const historyAwareRetriever = await createHistoryAwareRetriever({
  llm,
  retriever,
  rephrasePrompt: contextualizeQPrompt,
});

This chain prepends a rephrasing of the input query to our retriever, so that the retrieval incorporates the context of the conversation.

Now we can build our full QA chain.

As in the RAG tutorial, we will use createStuffDocumentsChain to generate a questionAnswerChain, with input keys context, chat_history, and input– it accepts the retrieved context alongside the conversation history and query to generate an answer.

We build our final ragChain with createRetrievalChain. This chain applies the historyAwareRetriever and questionAnswerChain in sequence, retaining intermediate outputs such as the retrieved context for convenience. It has input keys input and chat_history, and includes input, chat_history, context, and answer in its output.

import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { createRetrievalChain } from "langchain/chains/retrieval";

const systemPrompt =
  "You are an assistant for question-answering tasks. " +
  "Use the following pieces of retrieved context to answer " +
  "the question. If you don't know the answer, say that you " +
  "don't know. Use three sentences maximum and keep the " +
  "answer concise." +
  "\n\n" +
  "{context}";

const qaPrompt = ChatPromptTemplate.fromMessages([
  ["system", systemPrompt],
  new MessagesPlaceholder("chat_history"),
  ["human", "{input}"],
]);

const questionAnswerChain = await createStuffDocumentsChain({
  llm,
  prompt: qaPrompt,
});

const ragChain = await createRetrievalChain({
  retriever: historyAwareRetriever,
  combineDocsChain: questionAnswerChain,
});

Stateful Management of chat history
We have added application logic for incorporating chat history, but we are still manually plumbing it through our application. In production, the Q&A application we usually persist the chat history into a database, and be able to read and update it appropriately.

LangGraph implements a built-in persistence layer, making it ideal for chat applications that support multiple conversational turns.

Wrapping our chat model in a minimal LangGraph application allows us to automatically persist the message history, simplifying the development of multi-turn applications.

LangGraph comes with a simple in-memory checkpointer, which we use below. See its documentation for more detail, including how to use different persistence backends (e.g., SQLite or Postgres).

For a detailed walkthrough of how to manage message history, head to the How to add message history (memory) guide.

import { AIMessage, BaseMessage, HumanMessage } from "@langchain/core/messages";
import {
  StateGraph,
  START,
  END,
  MemorySaver,
  messagesStateReducer,
  Annotation,
} from "@langchain/langgraph";

// Define the State interface
const GraphAnnotation = Annotation.Root({
  input: Annotation<string>(),
  chat_history: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
  context: Annotation<string>(),
  answer: Annotation<string>(),
});

// Define the call_model function
async function callModel(state: typeof GraphAnnotation.State) {
  const response = await ragChain.invoke(state);
  return {
    chat_history: [
      new HumanMessage(state.input),
      new AIMessage(response.answer),
    ],
    context: response.context,
    answer: response.answer,
  };
}

// Create the workflow
const workflow = new StateGraph(GraphAnnotation)
  .addNode("model", callModel)
  .addEdge(START, "model")
  .addEdge("model", END);

// Compile the graph with a checkpointer object
const memory = new MemorySaver();
const app = workflow.compile({ checkpointer: memory });

import { v4 as uuidv4 } from "uuid";

const threadId = uuidv4();
const config = { configurable: { thread_id: threadId } };

const result = await app.invoke(
  { input: "What is Task Decomposition?" },
  config
);
console.log(result.answer);

Task Decomposition is the process of breaking down a complicated task into smaller, simpler, and more manageable steps. Techniques like Chain of Thought (CoT) and Tree of Thoughts expand on this by enabling agents to think step by step or explore multiple reasoning possibilities at each step. This allows for a more structured and interpretable approach to handling complex tasks.


const result2 = await app.invoke(
  { input: "What is one way of doing it?" },
  config
);
console.log(result2.answer);

One way of doing task decomposition is by using an LLM with simple prompting, such as asking "Steps for XYZ.\n1." or "What are the subgoals for achieving XYZ?" This method leverages direct prompts to guide the model in breaking down tasks.


The conversation history can be inspected via the state of the application:

const chatHistory = (await app.getState(config)).values.chat_history;
for (const message of chatHistory) {
  console.log(message);
}

HumanMessage {
  "content": "What is Task Decomposition?",
  "additional_kwargs": {},
  "response_metadata": {}
}
AIMessage {
  "content": "Task Decomposition is the process of breaking down a complicated task into smaller, simpler, and more manageable steps. Techniques like Chain of Thought (CoT) and Tree of Thoughts expand on this by enabling agents to think step by step or explore multiple reasoning possibilities at each step. This allows for a more structured and interpretable approach to handling complex tasks.",
  "additional_kwargs": {},
  "response_metadata": {},
  "tool_calls": [],
  "invalid_tool_calls": []
}
HumanMessage {
  "content": "What is one way of doing it?",
  "additional_kwargs": {},
  "response_metadata": {}
}
AIMessage {
  "content": "One way of doing task decomposition is by using an LLM with simple prompting, such as asking \"Steps for XYZ.\\n1.\" or \"What are the subgoals for achieving XYZ?\" This method leverages direct prompts to guide the model in breaking down tasks.",
  "additional_kwargs": {},
  "response_metadata": {},
  "tool_calls": [],
  "invalid_tool_calls": []
}


Tying it together


For convenience, we tie together all of the necessary steps in a single code cell:

import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { createHistoryAwareRetriever } from "langchain/chains/history_aware_retriever";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { AIMessage, BaseMessage, HumanMessage } from "@langchain/core/messages";
import {
  StateGraph,
  START,
  END,
  MemorySaver,
  messagesStateReducer,
  Annotation,
} from "@langchain/langgraph";
import { v4 as uuidv4 } from "uuid";

const llm2 = new ChatOpenAI({ model: "gpt-4o" });

const loader2 = new CheerioWebBaseLoader(
  "https://lilianweng.github.io/posts/2023-06-23-agent/"
);

const docs2 = await loader2.load();

const textSplitter2 = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});
const splits2 = await textSplitter2.splitDocuments(docs2);
const vectorStore2 = await MemoryVectorStore.fromDocuments(
  splits2,
  new OpenAIEmbeddings()
);

// Retrieve and generate using the relevant snippets of the blog.
const retriever2 = vectorStore2.asRetriever();

const contextualizeQSystemPrompt2 =
  "Given a chat history and the latest user question " +
  "which might reference context in the chat history, " +
  "formulate a standalone question which can be understood " +
  "without the chat history. Do NOT answer the question, " +
  "just reformulate it if needed and otherwise return it as is.";

const contextualizeQPrompt2 = ChatPromptTemplate.fromMessages([
  ["system", contextualizeQSystemPrompt2],
  new MessagesPlaceholder("chat_history"),
  ["human", "{input}"],
]);

const historyAwareRetriever2 = await createHistoryAwareRetriever({
  llm: llm2,
  retriever: retriever2,
  rephrasePrompt: contextualizeQPrompt2,
});

const systemPrompt2 =
  "You are an assistant for question-answering tasks. " +
  "Use the following pieces of retrieved context to answer " +
  "the question. If you don't know the answer, say that you " +
  "don't know. Use three sentences maximum and keep the " +
  "answer concise." +
  "\n\n" +
  "{context}";

const qaPrompt2 = ChatPromptTemplate.fromMessages([
  ["system", systemPrompt2],
  new MessagesPlaceholder("chat_history"),
  ["human", "{input}"],
]);

const questionAnswerChain2 = await createStuffDocumentsChain({
  llm: llm2,
  prompt: qaPrompt2,
});

const ragChain2 = await createRetrievalChain({
  retriever: historyAwareRetriever2,
  combineDocsChain: questionAnswerChain2,
});

// Define the State interface
const GraphAnnotation2 = Annotation.Root({
  input: Annotation<string>(),
  chat_history: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
  context: Annotation<string>(),
  answer: Annotation<string>(),
});

// Define the call_model function
async function callModel2(state: typeof GraphAnnotation2.State) {
  const response = await ragChain2.invoke(state);
  return {
    chat_history: [
      new HumanMessage(state.input),
      new AIMessage(response.answer),
    ],
    context: response.context,
    answer: response.answer,
  };
}

// Create the workflow
const workflow2 = new StateGraph(GraphAnnotation2)
  .addNode("model", callModel2)
  .addEdge(START, "model")
  .addEdge("model", END);

// Compile the graph with a checkpointer object
const memory2 = new MemorySaver();
const app2 = workflow2.compile({ checkpointer: memory2 });

const threadId2 = uuidv4();
const config2 = { configurable: { thread_id: threadId2 } };

const result3 = await app2.invoke(
  { input: "What is Task Decomposition?" },
  config2
);
console.log(result3.answer);

const result4 = await app2.invoke(
  { input: "What is one way of doing it?" },
  config2
);
console.log(result4.answer);

Task Decomposition is the process of breaking a complicated task into smaller, simpler steps to enhance model performance on complex tasks. Techniques like Chain of Thought (CoT) and Tree of Thoughts (ToT) are used for this, with CoT focusing on step-by-step thinking and ToT exploring multiple reasoning possibilities at each step. Decomposition can be carried out by the LLM itself, using task-specific instructions, or through human inputs.
One way of doing task decomposition is by prompting the LLM with simple instructions such as "Steps for XYZ.\n1." or "What are the subgoals for achieving XYZ?" This encourages the model to break down the task into smaller, manageable steps on its own.


Agents
Agents leverage the reasoning capabilities of LLMs to make decisions during execution. Using agents allow you to offload some discretion over the retrieval process. Although their behavior is less predictable than chains, they offer some advantages in this context: - Agents generate the input to the retriever directly, without necessarily needing us to explicitly build in contextualization, as we did above; - Agents can execute multiple retrieval steps in service of a query, or refrain from executing a retrieval step altogether (e.g., in response to a generic greeting from a user).

Retrieval tool
Agents can access “tools” and manage their execution. In this case, we will convert our retriever into a LangChain tool to be wielded by the agent:

import { createRetrieverTool } from "langchain/tools/retriever";

const tool = createRetrieverTool(retriever, {
  name: "blog_post_retriever",
  description:
    "Searches and returns excerpts from the Autonomous Agents blog post.",
});
const tools = [tool];

Agent constructor
Now that we have defined the tools and the LLM, we can create the agent. We will be using LangGraph to construct the agent. Currently we are using a high level interface to construct the agent, but the nice thing about LangGraph is that this high-level interface is backed by a low-level, highly controllable API in case you want to modify the agent logic.

import { createReactAgent } from "@langchain/langgraph/prebuilt";

const agentExecutor = createReactAgent({ llm, tools });

We can now try it out. Note that so far it is not stateful (we still need to add in memory)

const query = "What is Task Decomposition?";

for await (const s of await agentExecutor.stream({
  messages: [{ role: "user", content: query }],
})) {
  console.log(s);
  console.log("----");
}

{
  agent: {
    messages: [
      AIMessage {
        "id": "chatcmpl-AB7xlcJBGSKSp1GvgDY9FP8KvXxwB",
        "content": "",
        "additional_kwargs": {
          "tool_calls": [
            {
              "id": "call_Ev0nA6nzGwOeMC5upJUUxTuw",
              "type": "function",
              "function": "[Object]"
            }
          ]
        },
        "response_metadata": {
          "tokenUsage": {
            "completionTokens": 19,
            "promptTokens": 66,
            "totalTokens": 85
          },
          "finish_reason": "tool_calls",
          "system_fingerprint": "fp_52a7f40b0b"
        },
        "tool_calls": [
          {
            "name": "blog_post_retriever",
            "args": {
              "query": "Task Decomposition"
            },
            "type": "tool_call",
            "id": "call_Ev0nA6nzGwOeMC5upJUUxTuw"
          }
        ],
        "invalid_tool_calls": [],
        "usage_metadata": {
          "input_tokens": 66,
          "output_tokens": 19,
          "total_tokens": 85
        }
      }
    ]
  }
}
----
{
  tools: {
    messages: [
      ToolMessage {
        "content": "Fig. 1. Overview of a LLM-powered autonomous agent system.\nComponent One: Planning#\nA complicated task usually involves many steps. An agent needs to know what they are and plan ahead.\nTask Decomposition#\nChain of thought (CoT; Wei et al. 2022) has become a standard prompting technique for enhancing model performance on complex tasks. The model is instructed to “think step by step” to utilize more test-time computation to decompose hard tasks into smaller and simpler steps. CoT transforms big tasks into multiple manageable tasks and shed lights into an interpretation of the model’s thinking process.\nTree of Thoughts (Yao et al. 2023) extends CoT by exploring multiple reasoning possibilities at each step. It first decomposes the problem into multiple thought steps and generates multiple thoughts per step, creating a tree structure. The search process can be BFS (breadth-first search) or DFS (depth-first search) with each state evaluated by a classifier (via a prompt) or majority vote.\n\nTask decomposition can be done (1) by LLM with simple prompting like \"Steps for XYZ.\\n1.\", \"What are the subgoals for achieving XYZ?\", (2) by using task-specific instructions; e.g. \"Write a story outline.\" for writing a novel, or (3) with human inputs.\nAnother quite distinct approach, LLM+P (Liu et al. 2023), involves relying on an external classical planner to do long-horizon planning. This approach utilizes the Planning Domain Definition Language (PDDL) as an intermediate interface to describe the planning problem. In this process, LLM (1) translates the problem into “Problem PDDL”, then (2) requests a classical planner to generate a PDDL plan based on an existing “Domain PDDL”, and finally (3) translates the PDDL plan back into natural language. Essentially, the planning step is outsourced to an external tool, assuming the availability of domain-specific PDDL and a suitable planner which is common in certain robotic setups but not in many other domains.\nSelf-Reflection#\n\nAgent System Overview\n                \n                    Component One: Planning\n                        \n                \n                    Task Decomposition\n                \n                    Self-Reflection\n                \n                \n                    Component Two: Memory\n                        \n                \n                    Types of Memory\n                \n                    Maximum Inner Product Search (MIPS)\n                \n                \n                    Component Three: Tool Use\n                \n                    Case Studies\n                        \n                \n                    Scientific Discovery Agent\n                \n                    Generative Agents Simulation\n                \n                    Proof-of-Concept Examples\n                \n                \n                    Challenges\n                \n                    Citation\n                \n                    References\n\n(3) Task execution: Expert models execute on the specific tasks and log results.\nInstruction:\n\nWith the input and the inference results, the AI assistant needs to describe the process and results. The previous stages can be formed as - User Input: {{ User Input }}, Task Planning: {{ Tasks }}, Model Selection: {{ Model Assignment }}, Task Execution: {{ Predictions }}. You must first answer the user's request in a straightforward manner. Then describe the task process and show your analysis and model inference results to the user in the first person. If inference results contain a file path, must tell the user the complete file path.",
        "name": "blog_post_retriever",
        "additional_kwargs": {},
        "response_metadata": {},
        "tool_call_id": "call_Ev0nA6nzGwOeMC5upJUUxTuw"
      }
    ]
  }
}
----
{
  agent: {
    messages: [
      AIMessage {
        "id": "chatcmpl-AB7xmiPNPbMX2KvZKHM2oPfcoFMnY",
        "content": "**Task Decomposition** involves breaking down a complicated or large task into smaller, more manageable subtasks. Here are some insights based on current techniques and research:\n\n1. **Chain of Thought (CoT)**:\n   - Introduced by Wei et al. (2022), this technique prompts the model to \"think step by step\".\n   - It helps decompose hard tasks into several simpler steps.\n   - Enhances the interpretability of the model's thought process.\n\n2. **Tree of Thoughts (ToT)**:\n   - An extension of CoT by Yao et al. (2023).\n   - Decomposes problems into multiple thought steps and generates several possibilities at each step.\n   - Utilizes tree structures through BFS (Breadth-First Search) or DFS (Depth-First Search) with evaluation by a classifier or majority vote.\n\n3. **Methods of Task Decomposition**:\n   - **Simple Prompting**: Asking the model directly, e.g., \"Steps for XYZ.\\n1.\" or \"What are the subgoals for achieving XYZ?\".\n   - **Task-Specific Instructions**: Tailoring instructions to the task, such as \"Write a story outline\" for writing a novel.\n   - **Human Inputs**: Receiving inputs from humans to refine the process.\n\n4. **LLM+P Approach**:\n   - Suggested by Liu et al. (2023), combines language models with an external classical planner.\n   - Uses Planning Domain Definition Language (PDDL) for long-horizon planning:\n     1. Translates the problem into a PDDL problem.\n     2. Requests an external planner to generate a PDDL plan.\n     3. Translates the PDDL plan back into natural language.\n   - This method offloads the planning complexity to a specialized tool, especially relevant for domains utilizing robotic setups.\n\nTask Decomposition is a fundamental component of planning in autonomous agent systems, aiding in the efficient accomplishment of complex tasks by breaking them into smaller, actionable steps.",
        "additional_kwargs": {},
        "response_metadata": {
          "tokenUsage": {
            "completionTokens": 411,
            "promptTokens": 732,
            "totalTokens": 1143
          },
          "finish_reason": "stop",
          "system_fingerprint": "fp_e375328146"
        },
        "tool_calls": [],
        "invalid_tool_calls": [],
        "usage_metadata": {
          "input_tokens": 732,
          "output_tokens": 411,
          "total_tokens": 1143
        }
      }
    ]
  }
}
----


LangGraph comes with built in persistence, so we don’t need to use ChatMessageHistory! Rather, we can pass in a checkpointer to our LangGraph agent directly.

Distinct conversations are managed by specifying a key for a conversation thread in the config object, as shown below.

import { MemorySaver } from "@langchain/langgraph";

const memory3 = new MemorySaver();

const agentExecutor2 = createReactAgent({
  llm,
  tools,
  checkpointSaver: memory3,
});

This is all we need to construct a conversational RAG agent.

Let’s observe its behavior. Note that if we input a query that does not require a retrieval step, the agent does not execute one:

const threadId3 = uuidv4();
const config3 = { configurable: { thread_id: threadId3 } };

for await (const s of await agentExecutor2.stream(
  { messages: [{ role: "user", content: "Hi! I'm bob" }] },
  config3
)) {
  console.log(s);
  console.log("----");
}

{
  agent: {
    messages: [
      AIMessage {
        "id": "chatcmpl-AB7y8P8AGHkxOwKpwMc3qj6r0skYr",
        "content": "Hello, Bob! How can I assist you today?",
        "additional_kwargs": {},
        "response_metadata": {
          "tokenUsage": {
            "completionTokens": 12,
            "promptTokens": 64,
            "totalTokens": 76
          },
          "finish_reason": "stop",
          "system_fingerprint": "fp_e375328146"
        },
        "tool_calls": [],
        "invalid_tool_calls": [],
        "usage_metadata": {
          "input_tokens": 64,
          "output_tokens": 12,
          "total_tokens": 76
        }
      }
    ]
  }
}
----

Further, if we input a query that does require a retrieval step, the agent generates the input to the tool:

const query2 = "What is Task Decomposition?";

for await (const s of await agentExecutor2.stream(
  { messages: [{ role: "user", content: query2 }] },
  config3
)) {
  console.log(s);
  console.log("----");
}

{
  agent: {
    messages: [
      AIMessage {
        "id": "chatcmpl-AB7y8Do2IHJ2rnUvvMU3pTggmuZud",
        "content": "",
        "additional_kwargs": {
          "tool_calls": [
            {
              "id": "call_3tSaOZ3xdKY4miIJdvBMR80V",
              "type": "function",
              "function": "[Object]"
            }
          ]
        },
        "response_metadata": {
          "tokenUsage": {
            "completionTokens": 19,
            "promptTokens": 89,
            "totalTokens": 108
          },
          "finish_reason": "tool_calls",
          "system_fingerprint": "fp_e375328146"
        },
        "tool_calls": [
          {
            "name": "blog_post_retriever",
            "args": {
              "query": "Task Decomposition"
            },
            "type": "tool_call",
            "id": "call_3tSaOZ3xdKY4miIJdvBMR80V"
          }
        ],
        "invalid_tool_calls": [],
        "usage_metadata": {
          "input_tokens": 89,
          "output_tokens": 19,
          "total_tokens": 108
        }
      }
    ]
  }
}
----
{
  tools: {
    messages: [
      ToolMessage {
        "content": "Fig. 1. Overview of a LLM-powered autonomous agent system.\nComponent One: Planning#\nA complicated task usually involves many steps. An agent needs to know what they are and plan ahead.\nTask Decomposition#\nChain of thought (CoT; Wei et al. 2022) has become a standard prompting technique for enhancing model performance on complex tasks. The model is instructed to “think step by step” to utilize more test-time computation to decompose hard tasks into smaller and simpler steps. CoT transforms big tasks into multiple manageable tasks and shed lights into an interpretation of the model’s thinking process.\nTree of Thoughts (Yao et al. 2023) extends CoT by exploring multiple reasoning possibilities at each step. It first decomposes the problem into multiple thought steps and generates multiple thoughts per step, creating a tree structure. The search process can be BFS (breadth-first search) or DFS (depth-first search) with each state evaluated by a classifier (via a prompt) or majority vote.\n\nTask decomposition can be done (1) by LLM with simple prompting like \"Steps for XYZ.\\n1.\", \"What are the subgoals for achieving XYZ?\", (2) by using task-specific instructions; e.g. \"Write a story outline.\" for writing a novel, or (3) with human inputs.\nAnother quite distinct approach, LLM+P (Liu et al. 2023), involves relying on an external classical planner to do long-horizon planning. This approach utilizes the Planning Domain Definition Language (PDDL) as an intermediate interface to describe the planning problem. In this process, LLM (1) translates the problem into “Problem PDDL”, then (2) requests a classical planner to generate a PDDL plan based on an existing “Domain PDDL”, and finally (3) translates the PDDL plan back into natural language. Essentially, the planning step is outsourced to an external tool, assuming the availability of domain-specific PDDL and a suitable planner which is common in certain robotic setups but not in many other domains.\nSelf-Reflection#\n\nAgent System Overview\n                \n                    Component One: Planning\n                        \n                \n                    Task Decomposition\n                \n                    Self-Reflection\n                \n                \n                    Component Two: Memory\n                        \n                \n                    Types of Memory\n                \n                    Maximum Inner Product Search (MIPS)\n                \n                \n                    Component Three: Tool Use\n                \n                    Case Studies\n                        \n                \n                    Scientific Discovery Agent\n                \n                    Generative Agents Simulation\n                \n                    Proof-of-Concept Examples\n                \n                \n                    Challenges\n                \n                    Citation\n                \n                    References\n\n(3) Task execution: Expert models execute on the specific tasks and log results.\nInstruction:\n\nWith the input and the inference results, the AI assistant needs to describe the process and results. The previous stages can be formed as - User Input: {{ User Input }}, Task Planning: {{ Tasks }}, Model Selection: {{ Model Assignment }}, Task Execution: {{ Predictions }}. You must first answer the user's request in a straightforward manner. Then describe the task process and show your analysis and model inference results to the user in the first person. If inference results contain a file path, must tell the user the complete file path.",
        "name": "blog_post_retriever",
        "additional_kwargs": {},
        "response_metadata": {},
        "tool_call_id": "call_3tSaOZ3xdKY4miIJdvBMR80V"
      }
    ]
  }
}
----
{
  agent: {
    messages: [
      AIMessage {
        "id": "chatcmpl-AB7y9tpoTvM3lsrhoxCWkkerk9fb2",
        "content": "Task decomposition is a methodology used to break down complex tasks into smaller, more manageable steps. Here’s an overview of various approaches to task decomposition:\n\n1. **Chain of Thought (CoT)**: This technique prompts a model to \"think step by step,\" which aids in transforming big tasks into multiple smaller tasks. This method enhances the model’s performance on complex tasks by making the problem more manageable and interpretable.\n\n2. **Tree of Thoughts (ToT)**: An extension of Chain of Thought, this approach explores multiple reasoning possibilities at each step, effectively creating a tree structure. The search process can be carried out using Breadth-First Search (BFS) or Depth-First Search (DFS), with each state evaluated by either a classifier or a majority vote.\n\n3. **Simple Prompting**: Involves straightforward instructions to decompose a task, such as starting with \"Steps for XYZ. 1.\" or asking \"What are the subgoals for achieving XYZ?\". This can also include task-specific instructions like \"Write a story outline\" for writing a novel.\n\n4. **LLM+P**: Combines Large Language Models (LLMs) with an external classical planner. The problem is translated into a Planning Domain Definition Language (PDDL) format, an external planner generates a plan, and then the plan is translated back into natural language. This approach highlights a synergy between modern AI techniques and traditional planning strategies.\n\nThese approaches allow complex problems to be approached and solved more efficiently by focusing on manageable sub-tasks.",
        "additional_kwargs": {},
        "response_metadata": {
          "tokenUsage": {
            "completionTokens": 311,
            "promptTokens": 755,
            "totalTokens": 1066
          },
          "finish_reason": "stop",
          "system_fingerprint": "fp_52a7f40b0b"
        },
        "tool_calls": [],
        "invalid_tool_calls": [],
        "usage_metadata": {
          "input_tokens": 755,
          "output_tokens": 311,
          "total_tokens": 1066
        }
      }
    ]
  }
}
----


Above, instead of inserting our query verbatim into the tool, the agent stripped unnecessary words like “what” and “is”.

This same principle allows the agent to use the context of the conversation when necessary:

const query3 =
  "What according to the blog post are common ways of doing it? redo the search";

for await (const s of await agentExecutor2.stream(
  { messages: [{ role: "user", content: query3 }] },
  config3
)) {
  console.log(s);
  console.log("----");
}

{
  agent: {
    messages: [
      AIMessage {
        "id": "chatcmpl-AB7yDE4rCOXTPZ3595GknUgVzASmt",
        "content": "",
        "additional_kwargs": {
          "tool_calls": [
            {
              "id": "call_cWnDZq2aloVtMB4KjZlTxHmZ",
              "type": "function",
              "function": "[Object]"
            }
          ]
        },
        "response_metadata": {
          "tokenUsage": {
            "completionTokens": 21,
            "promptTokens": 1089,
            "totalTokens": 1110
          },
          "finish_reason": "tool_calls",
          "system_fingerprint": "fp_52a7f40b0b"
        },
        "tool_calls": [
          {
            "name": "blog_post_retriever",
            "args": {
              "query": "common ways of task decomposition"
            },
            "type": "tool_call",
            "id": "call_cWnDZq2aloVtMB4KjZlTxHmZ"
          }
        ],
        "invalid_tool_calls": [],
        "usage_metadata": {
          "input_tokens": 1089,
          "output_tokens": 21,
          "total_tokens": 1110
        }
      }
    ]
  }
}
----
{
  tools: {
    messages: [
      ToolMessage {
        "content": "Fig. 1. Overview of a LLM-powered autonomous agent system.\nComponent One: Planning#\nA complicated task usually involves many steps. An agent needs to know what they are and plan ahead.\nTask Decomposition#\nChain of thought (CoT; Wei et al. 2022) has become a standard prompting technique for enhancing model performance on complex tasks. The model is instructed to “think step by step” to utilize more test-time computation to decompose hard tasks into smaller and simpler steps. CoT transforms big tasks into multiple manageable tasks and shed lights into an interpretation of the model’s thinking process.\nTree of Thoughts (Yao et al. 2023) extends CoT by exploring multiple reasoning possibilities at each step. It first decomposes the problem into multiple thought steps and generates multiple thoughts per step, creating a tree structure. The search process can be BFS (breadth-first search) or DFS (depth-first search) with each state evaluated by a classifier (via a prompt) or majority vote.\n\nTask decomposition can be done (1) by LLM with simple prompting like \"Steps for XYZ.\\n1.\", \"What are the subgoals for achieving XYZ?\", (2) by using task-specific instructions; e.g. \"Write a story outline.\" for writing a novel, or (3) with human inputs.\nAnother quite distinct approach, LLM+P (Liu et al. 2023), involves relying on an external classical planner to do long-horizon planning. This approach utilizes the Planning Domain Definition Language (PDDL) as an intermediate interface to describe the planning problem. In this process, LLM (1) translates the problem into “Problem PDDL”, then (2) requests a classical planner to generate a PDDL plan based on an existing “Domain PDDL”, and finally (3) translates the PDDL plan back into natural language. Essentially, the planning step is outsourced to an external tool, assuming the availability of domain-specific PDDL and a suitable planner which is common in certain robotic setups but not in many other domains.\nSelf-Reflection#\n\nAgent System Overview\n                \n                    Component One: Planning\n                        \n                \n                    Task Decomposition\n                \n                    Self-Reflection\n                \n                \n                    Component Two: Memory\n                        \n                \n                    Types of Memory\n                \n                    Maximum Inner Product Search (MIPS)\n                \n                \n                    Component Three: Tool Use\n                \n                    Case Studies\n                        \n                \n                    Scientific Discovery Agent\n                \n                    Generative Agents Simulation\n                \n                    Proof-of-Concept Examples\n                \n                \n                    Challenges\n                \n                    Citation\n                \n                    References\n\nResources:\n1. Internet access for searches and information gathering.\n2. Long Term memory management.\n3. GPT-3.5 powered Agents for delegation of simple tasks.\n4. File output.\n\nPerformance Evaluation:\n1. Continuously review and analyze your actions to ensure you are performing to the best of your abilities.\n2. Constructively self-criticize your big-picture behavior constantly.\n3. Reflect on past decisions and strategies to refine your approach.\n4. Every command has a cost, so be smart and efficient. Aim to complete tasks in the least number of steps.",
        "name": "blog_post_retriever",
        "additional_kwargs": {},
        "response_metadata": {},
        "tool_call_id": "call_cWnDZq2aloVtMB4KjZlTxHmZ"
      }
    ]
  }
}
----
{
  agent: {
    messages: [
      AIMessage {
        "id": "chatcmpl-AB7yGASxz0Z0g2jiCxwx4gYHYJTi4",
        "content": "According to the blog post, there are several common methods of task decomposition:\n\n1. **Simple Prompting by LLMs**: This involves straightforward instructions to decompose a task. Examples include:\n   - \"Steps for XYZ. 1.\"\n   - \"What are the subgoals for achieving XYZ?\"\n   - Task-specific instructions like \"Write a story outline\" for writing a novel.\n\n2. **Human Inputs**: Decomposition can be guided by human insights and instructions.\n\n3. **Chain of Thought (CoT)**: This technique prompts a model to think step-by-step, enabling it to break down complex tasks into smaller, more manageable tasks. CoT has become a standard method to enhance model performance on intricate tasks.\n\n4. **Tree of Thoughts (ToT)**: An extension of CoT, this approach decomposes the problem into multiple thought steps and generates several thoughts per step, forming a tree structure. The search process can be performed using Breadth-First Search (BFS) or Depth-First Search (DFS), with each state evaluated by a classifier or through a majority vote.\n\n5. **LLM+P (Large Language Model plus Planner)**: This method integrates LLMs with an external classical planner. It involves:\n   - Translating the problem into “Problem PDDL” (Planning Domain Definition Language).\n   - Using an external planner to generate a PDDL plan based on an existing “Domain PDDL”.\n   - Translating the PDDL plan back into natural language.\n  \nBy utilizing these methods, tasks can be effectively decomposed into more manageable parts, allowing for more efficient problem-solving and planning.",
        "additional_kwargs": {},
        "response_metadata": {
          "tokenUsage": {
            "completionTokens": 334,
            "promptTokens": 1746,
            "totalTokens": 2080
          },
          "finish_reason": "stop",
          "system_fingerprint": "fp_52a7f40b0b"
        },
        "tool_calls": [],
        "invalid_tool_calls": [],
        "usage_metadata": {
          "input_tokens": 1746,
          "output_tokens": 334,
          "total_tokens": 2080
        }
      }
    ]
  }
}
----


Note that the agent was able to infer that “it” in our query refers to “task decomposition”, and generated a reasonable search query as a result– in this case, “common ways of task decomposition”.

Tying it together
For convenience, we tie together all of the necessary steps in a single code cell:

import { createRetrieverTool } from "langchain/tools/retriever";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { MemorySaver } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings } from "@langchain/openai";

const llm3 = new ChatOpenAI({ model: "gpt-4o" });

const loader3 = new CheerioWebBaseLoader(
  "https://lilianweng.github.io/posts/2023-06-23-agent/"
);

const docs3 = await loader3.load();

const textSplitter3 = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});
const splits3 = await textSplitter3.splitDocuments(docs3);
const vectorStore3 = await MemoryVectorStore.fromDocuments(
  splits3,
  new OpenAIEmbeddings()
);

// Retrieve and generate using the relevant snippets of the blog.
const retriever3 = vectorStore3.asRetriever();

const tool2 = createRetrieverTool(retriever3, {
  name: "blog_post_retriever",
  description:
    "Searches and returns excerpts from the Autonomous Agents blog post.",
});
const tools2 = [tool2];
const memory4 = new MemorySaver();

const agentExecutor3 = createReactAgent({
  llm: llm3,
  tools: tools2,
  checkpointSaver: memory4,
});

Next steps
We’ve covered the steps to build a basic conversational Q&A application:

We used chains to build a predictable application that generates search queries for each user input;
We used agents to build an application that “decides” when and how to generate search queries.
To explore different types of retrievers and retrieval strategies, visit the retrievers section of the how-to guides.

For a detailed walkthrough of LangChain’s conversation memory abstractions, visit the How to add message history (memory) LCEL page.

