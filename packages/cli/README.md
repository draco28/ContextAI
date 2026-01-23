# @contextaisdk/cli

CLI for scaffolding ContextAI projects and packages.

## Installation

```bash
npm install -g @contextaisdk/cli
# or
pnpm add -g @contextaisdk/cli
# or use directly with npx
npx @contextaisdk/cli
```

## Commands

### `contextai new <type> <name>`

Create a new package in the monorepo.

**Types:**
- `provider` - LLM provider adapter (e.g., `provider-openai`)
- `agent` - Agent/feature package
- `component` - React component package
- `library` - Utility library

**Examples:**
```bash
# Create a new provider
contextai new provider my-llm

# Create a new agent with defaults
contextai new agent my-agent --yes

# Preview without creating files
contextai new component my-component --dry-run
```

**Options:**
- `-y, --yes` - Skip prompts and use defaults
- `-d, --dry-run` - Preview files without creating them
- `--description <desc>` - Custom package description

### `contextai init`

Bootstrap a new ContextAI project with monorepo structure.

```bash
contextai init
contextai init --template minimal
```

**Options:**
- `-y, --yes` - Skip prompts and use defaults
- `-d, --dry-run` - Preview files without creating them
- `-t, --template <template>` - Template to use (minimal, full)

### `contextai analyze`

Analyze bundle sizes of packages in the monorepo.

```bash
contextai analyze
contextai analyze --filter core
contextai analyze --format json
```

**Options:**
- `-f, --filter <package>` - Filter to specific package
- `--format <format>` - Output format (table, json)
- `--detailed` - Show detailed breakdown

## Package Templates

### Provider Template

Creates a fully-typed LLM provider adapter with:
- `LLMProvider` interface implementation
- Typed configuration
- Custom error class with error codes
- Test scaffolding with mocks

### Agent Template

Creates an agent package with:
- `Agent` interface implementation
- Typed configuration and results
- Test scaffolding

### Component Template

Creates a React component package with:
- Functional component
- Custom hook
- TypeScript props types
- Test scaffolding with React Testing Library

### Library Template

Creates a utility library with:
- Export barrel
- Example utilities
- Test scaffolding

## Development

```bash
# Build the CLI
pnpm build --filter=@contextaisdk/cli

# Test locally
node packages/cli/dist/index.cjs --help
node packages/cli/dist/index.cjs new provider test

# Run tests
pnpm test --filter=@contextaisdk/cli
```

## License

MIT
