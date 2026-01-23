# Tutorial: Build a Code Assistant

Build an AI assistant that answers questions about your codebase.

**Time**: 45 minutes
**Difficulty**: Intermediate
**You'll learn**: Code-aware RAG, file tools, syntax highlighting

## What We're Building

A code assistant that:
- Reads and understands your codebase
- Answers questions about implementation details
- Finds relevant code snippets
- Explains how code works

## Prerequisites

```bash
# Create project
mkdir code-assistant && cd code-assistant
pnpm init -y

# Install dependencies
pnpm add @contextaisdk/core @contextaisdk/rag @contextaisdk/provider-openai zod
pnpm add -D typescript tsx @types/node
```

## Step 1: Create File Reading Tools

Create `src/tools/file-tools.ts`:

```typescript
import { defineTool } from '@contextaisdk/core';
import { z } from 'zod';
import * as fs from 'fs/promises';
import * as path from 'path';

// Tool to read a specific file
export const readFileTool = defineTool({
  name: 'read_file',
  description: 'Read the contents of a file from the codebase',
  parameters: z.object({
    filePath: z.string().describe('Relative path to the file'),
  }),
  execute: async ({ filePath }) => {
    try {
      const fullPath = path.resolve(process.cwd(), filePath);
      const content = await fs.readFile(fullPath, 'utf-8');
      return {
        success: true,
        path: filePath,
        content,
        lines: content.split('\n').length,
      };
    } catch (error) {
      return {
        success: false,
        error: `Could not read file: ${filePath}`,
      };
    }
  },
});

// Tool to list files in a directory
export const listFilesTool = defineTool({
  name: 'list_files',
  description: 'List files in a directory',
  parameters: z.object({
    directory: z.string().describe('Directory path'),
    pattern: z.string().optional().describe('File pattern (e.g., "*.ts")'),
  }),
  execute: async ({ directory, pattern }) => {
    try {
      const fullPath = path.resolve(process.cwd(), directory);
      const entries = await fs.readdir(fullPath, { withFileTypes: true });

      let files = entries.map((e) => ({
        name: e.name,
        type: e.isDirectory() ? 'directory' : 'file',
        path: path.join(directory, e.name),
      }));

      // Filter by pattern if provided
      if (pattern) {
        const regex = new RegExp(
          pattern.replace('*', '.*').replace('.', '\\.')
        );
        files = files.filter((f) => regex.test(f.name));
      }

      return { success: true, files };
    } catch (error) {
      return { success: false, error: `Could not list directory: ${directory}` };
    }
  },
});

// Tool to search for text in files
export const searchCodeTool = defineTool({
  name: 'search_code',
  description: 'Search for text or patterns in the codebase',
  parameters: z.object({
    query: z.string().describe('Search query or regex pattern'),
    directory: z.string().optional().default('.').describe('Directory to search'),
    fileType: z.string().optional().describe('File extension (e.g., "ts")'),
  }),
  execute: async ({ query, directory, fileType }) => {
    const results: Array<{
      file: string;
      line: number;
      content: string;
    }> = [];

    async function searchDir(dir: string) {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        // Skip node_modules and hidden directories
        if (entry.name.startsWith('.') || entry.name === 'node_modules') {
          continue;
        }

        if (entry.isDirectory()) {
          await searchDir(fullPath);
        } else if (entry.isFile()) {
          // Filter by file type
          if (fileType && !entry.name.endsWith(`.${fileType}`)) {
            continue;
          }

          try {
            const content = await fs.readFile(fullPath, 'utf-8');
            const lines = content.split('\n');

            lines.forEach((line, i) => {
              if (line.toLowerCase().includes(query.toLowerCase())) {
                results.push({
                  file: fullPath,
                  line: i + 1,
                  content: line.trim(),
                });
              }
            });
          } catch {
            // Skip unreadable files
          }
        }
      }
    }

    await searchDir(path.resolve(process.cwd(), directory));

    return {
      success: true,
      matches: results.slice(0, 20), // Limit results
      totalMatches: results.length,
    };
  },
});
```

## Step 2: Set Up Code-Aware RAG

Create `src/code-rag.ts`:

```typescript
import {
  RAGEngineImpl,
  InMemoryVectorStore,
  HuggingFaceEmbeddingProvider,
  RecursiveChunker,
  DenseRetriever,
  MarkdownAssembler,
} from '@contextaisdk/rag';
import * as fs from 'fs/promises';
import * as path from 'path';

const embeddings = new HuggingFaceEmbeddingProvider({
  model: 'BAAI/bge-small-en-v1.5',
});

const vectorStore = new InMemoryVectorStore({
  dimensions: 384,
});

// Use smaller chunks for code
const chunker = new RecursiveChunker({
  chunkSize: 256,
  separators: ['\n\n', '\n', ' '],
});

const retriever = new DenseRetriever({
  vectorStore,
  embeddings,
  topK: 10,
});

export const codeRag = new RAGEngineImpl({
  embeddingProvider: embeddings,
  vectorStore,
  chunker,
  retriever,
  assembler: new MarkdownAssembler({ includeCitations: true }),
});

// Ingest a directory of code files
export async function ingestCodebase(directory: string) {
  const supportedExtensions = ['.ts', '.tsx', '.js', '.jsx', '.md', '.json'];
  const documents: Array<{ content: string; metadata: Record<string, string> }> = [];

  async function processDir(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(directory, fullPath);

      // Skip unwanted directories
      if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist') {
        continue;
      }

      if (entry.isDirectory()) {
        await processDir(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (!supportedExtensions.includes(ext)) continue;

        try {
          const content = await fs.readFile(fullPath, 'utf-8');

          // Add file header for context
          const enrichedContent = `# File: ${relativePath}\n\n${content}`;

          documents.push({
            content: enrichedContent,
            metadata: {
              source: relativePath,
              extension: ext,
              type: 'code',
            },
          });
        } catch {
          // Skip unreadable files
        }
      }
    }
  }

  await processDir(directory);
  console.log(`Found ${documents.length} code files`);

  await codeRag.ingest(documents);
  console.log('Codebase indexed!');
}
```

## Step 3: Create the Search Tool

Create `src/tools/search-tool.ts`:

```typescript
import { defineTool } from '@contextaisdk/core';
import { z } from 'zod';
import { codeRag } from '../code-rag';

export const searchCodebaseTool = defineTool({
  name: 'search_codebase',
  description: `Semantic search through the codebase.
    Use this to find code related to a concept, pattern, or functionality.
    Better than grep for understanding "how is X implemented?"`,
  parameters: z.object({
    query: z.string().describe('What you want to find (e.g., "user authentication", "API routing")'),
  }),
  execute: async ({ query }) => {
    const results = await codeRag.search(query, {
      topK: 5,
      rerank: false, // Skip reranking for speed
    });

    return {
      context: results.context,
      sources: results.sources.map((s) => s.source),
    };
  },
});
```

## Step 4: Create the Code Agent

Create `src/agent.ts`:

```typescript
import { Agent } from '@contextaisdk/core';
import { OpenAIProvider } from '@contextaisdk/provider-openai';
import { readFileTool, listFilesTool, searchCodeTool } from './tools/file-tools';
import { searchCodebaseTool } from './tools/search-tool';

const provider = new OpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY!,
  model: 'gpt-4o',
});

export const codeAgent = new Agent({
  name: 'Code Assistant',
  systemPrompt: `You are an expert code assistant that helps developers understand codebases.

Available tools:
- search_codebase: Semantic search for concepts and patterns
- search_code: Grep-like search for specific text
- read_file: Read specific file contents
- list_files: List directory contents

Strategy for answering questions:
1. For "how does X work?" -> search_codebase first
2. For "where is X defined?" -> search_code with the name
3. For implementation details -> read_file
4. For project structure -> list_files

Guidelines:
- Always search before answering
- Show relevant code snippets
- Explain code clearly
- Reference file paths
- If unsure, explore the codebase`,
  llm: provider,
  tools: [searchCodebaseTool, searchCodeTool, readFileTool, listFilesTool],
  maxIterations: 10,
});
```

## Step 5: Build the CLI

Create `src/cli.ts`:

```typescript
import * as readline from 'readline';
import { codeAgent } from './agent';
import { ingestCodebase } from './code-rag';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function main() {
  // Get directory to analyze
  const targetDir = process.argv[2] || '.';

  console.log(`\n🔍 Indexing codebase: ${targetDir}`);
  await ingestCodebase(targetDir);

  console.log('\n💻 Code Assistant Ready!');
  console.log('Ask questions about the codebase.');
  console.log('Examples:');
  console.log('  - "How is authentication implemented?"');
  console.log('  - "Where are the API routes defined?"');
  console.log('  - "Explain the database schema"');
  console.log('Type "exit" to quit.\n');

  const ask = () => {
    rl.question('You: ', async (input) => {
      if (input.toLowerCase() === 'exit') {
        console.log('Goodbye!');
        rl.close();
        return;
      }

      console.log('\nAssistant:');

      try {
        for await (const event of codeAgent.stream(input)) {
          switch (event.type) {
            case 'text':
              process.stdout.write(event.text);
              break;
            case 'thought':
              console.log(`\n[💭 ${event.content}]`);
              break;
            case 'action':
              console.log(`\n[🔧 ${event.tool}(${JSON.stringify(event.input)})]`);
              break;
            case 'observation':
              // Summarize large outputs
              const preview = JSON.stringify(event.result).slice(0, 100);
              console.log(`[📋 Result: ${preview}...]`);
              break;
          }
        }
      } catch (error) {
        console.error('\nError:', error);
      }

      console.log('\n');
      ask();
    });
  };

  ask();
}

main().catch(console.error);
```

## Step 6: Run It!

```bash
# Analyze current directory
npx tsx src/cli.ts .

# Or analyze a specific project
npx tsx src/cli.ts /path/to/project
```

Try asking:
- "What's the project structure?"
- "How is error handling implemented?"
- "Find all API endpoints"
- "Explain the main entry point"

## Advanced Features

### Syntax-Aware Chunking

Better chunking for code:

```typescript
import { CodeChunker } from '@contextaisdk/rag';

const codeChunker = new CodeChunker({
  language: 'typescript',
  chunkByFunction: true,
  includeImports: true,
});
```

### Show Line Numbers

```typescript
execute: async ({ filePath }) => {
  const content = await fs.readFile(filePath, 'utf-8');
  const lines = content.split('\n');

  const numberedContent = lines
    .map((line, i) => `${(i + 1).toString().padStart(4)} | ${line}`)
    .join('\n');

  return { content: numberedContent };
},
```

### Function Extraction

```typescript
const findFunctionTool = defineTool({
  name: 'find_function',
  description: 'Find a specific function definition',
  parameters: z.object({
    functionName: z.string(),
  }),
  execute: async ({ functionName }) => {
    // Search for function definitions
    const patterns = [
      `function ${functionName}`,
      `const ${functionName} =`,
      `async function ${functionName}`,
      `export function ${functionName}`,
    ];

    for (const pattern of patterns) {
      const results = await searchCode(pattern);
      if (results.length > 0) {
        // Read the file and extract the full function
        // ...
      }
    }
  },
});
```

### Git Integration

```typescript
const gitBlameTool = defineTool({
  name: 'git_blame',
  description: 'Show who last modified each line',
  parameters: z.object({
    filePath: z.string(),
  }),
  execute: async ({ filePath }) => {
    const { execSync } = require('child_process');
    const blame = execSync(`git blame ${filePath}`, { encoding: 'utf-8' });
    return { blame };
  },
});
```

## Performance Tips

### 1. Incremental Indexing

Only re-index changed files:

```typescript
import { createHash } from 'crypto';

const fileHashes = new Map<string, string>();

async function shouldReindex(file: string): Promise<boolean> {
  const content = await fs.readFile(file, 'utf-8');
  const hash = createHash('md5').update(content).digest('hex');

  if (fileHashes.get(file) === hash) {
    return false;
  }

  fileHashes.set(file, hash);
  return true;
}
```

### 2. Exclude Large Files

```typescript
const MAX_FILE_SIZE = 100 * 1024; // 100KB

const stats = await fs.stat(fullPath);
if (stats.size > MAX_FILE_SIZE) {
  console.log(`Skipping large file: ${fullPath}`);
  continue;
}
```

### 3. Cache Results

```typescript
const searchCache = new Map<string, any>();

execute: async ({ query }) => {
  if (searchCache.has(query)) {
    return searchCache.get(query);
  }

  const results = await codeRag.search(query);
  searchCache.set(query, results);
  return results;
},
```

## Project Structure

```
code-assistant/
├── src/
│   ├── tools/
│   │   ├── file-tools.ts   # File operations
│   │   └── search-tool.ts  # RAG search
│   ├── code-rag.ts         # RAG setup
│   ├── agent.ts            # Code agent
│   └── cli.ts              # CLI interface
├── package.json
└── tsconfig.json
```

## Next Steps

- [Build Q&A Chatbot](./build-qa-chatbot.md) - Add React UI
- [Document Assistant](./document-assistant.md) - Documentation RAG
- [Agentic RAG](../how-to/rag/agentic-rag.md) - Advanced retrieval
