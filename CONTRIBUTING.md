# Contributing to ContextAI

Thank you for your interest in contributing to ContextAI! This document provides guidelines and instructions for contributing.

## Development Setup

### Prerequisites

- **Node.js** >= 18.0.0 (LTS recommended)
- **pnpm** 9.x (`npm install -g pnpm`)
- **Git**

### Installation

```bash
# Clone the repository
git clone https://github.com/draco28/ContextAI.git
cd ContextAI

# Install dependencies
pnpm install

# Build all packages
pnpm build
```

### Verify Setup

```bash
# Run tests
pnpm test

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Format check
pnpm format:check
```

## Project Structure

```
contextai/
├── packages/
│   ├── core/              # Agent runtime, ReAct loop, tool framework
│   ├── rag/               # RAG pipeline (chunking, retrieval, reranking)
│   ├── provider-openai/   # OpenAI GPT provider adapter
│   ├── provider-anthropic/ # Anthropic Claude provider adapter
│   └── tsconfig/          # Shared TypeScript configurations
├── tools/                 # Development tools and scripts
├── turbo.json            # Turborepo configuration
├── pnpm-workspace.yaml   # pnpm workspace configuration
└── package.json          # Root package.json
```

## Coding Standards

### TypeScript

- **Strict mode** is enforced across all packages
- No `any` types allowed - use `unknown` if type is truly unknown
- Prefer interfaces over type aliases for object shapes
- Export types explicitly from package entry points

### Code Style

- **Prettier** handles formatting (single quotes, trailing commas, 2 spaces)
- **ESLint** enforces code quality rules
- Run `pnpm format` to auto-format code
- Run `pnpm lint` to check for issues

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files | kebab-case | `vector-store.ts` |
| Classes | PascalCase | `VectorStore` |
| Interfaces | PascalCase with `I` prefix (optional) | `VectorStore` or `IVectorStore` |
| Functions | camelCase | `calculateScore` |
| Constants | SCREAMING_SNAKE_CASE | `DEFAULT_CHUNK_SIZE` |
| Type parameters | Single uppercase letter | `T`, `K`, `V` |

## Making Changes

### Branch Naming

```
feature/ticket-XX-short-description  # New features
fix/ticket-XX-short-description      # Bug fixes
docs/short-description               # Documentation only
refactor/short-description           # Code refactoring
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(core): add streaming support for agent responses
fix(rag): handle empty document arrays in chunker
test(provider-openai): add integration tests for streaming
docs(readme): update quick start examples
refactor(core): extract tool validation logic
chore: update dependencies
```

**Commit Message Format:**
```
<type>(<scope>): <short description>

[optional body]

[optional footer]
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `test` - Adding or updating tests
- `refactor` - Code change that neither fixes a bug nor adds a feature
- `chore` - Build process, dependencies, etc.
- `perf` - Performance improvement

**Scopes:** `core`, `rag`, `provider-openai`, `provider-anthropic`, `docs`, etc.

## Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests for a specific package
pnpm --filter @contextai/core test

# Run tests with coverage
pnpm test -- --coverage
```

### Writing Tests

- Place tests in `__tests__/` directories or alongside source files as `*.test.ts`
- Use descriptive test names: `it('should handle empty arrays gracefully')`
- Mock external dependencies (LLM APIs, file system, etc.)
- Aim for high coverage on public APIs

```typescript
import { describe, it, expect, vi } from 'vitest';
import { MyClass } from '../my-class';

describe('MyClass', () => {
  describe('myMethod', () => {
    it('should return expected result', () => {
      const instance = new MyClass();
      expect(instance.myMethod()).toBe('expected');
    });

    it('should throw on invalid input', () => {
      const instance = new MyClass();
      expect(() => instance.myMethod(null)).toThrow();
    });
  });
});
```

## Pull Request Process

### Before Submitting

1. **Create a feature branch** from `main`
2. **Write tests** for new functionality
3. **Ensure all checks pass:**
   ```bash
   pnpm lint
   pnpm typecheck
   pnpm test
   pnpm build
   ```
4. **Create a changeset** (for version bumps):
   ```bash
   pnpm changeset
   ```
5. **Update documentation** if needed

### PR Checklist

- [ ] Tests pass locally (`pnpm test`)
- [ ] Types check (`pnpm typecheck`)
- [ ] Linting passes (`pnpm lint`)
- [ ] Added tests for new functionality
- [ ] Updated documentation if needed
- [ ] Created changeset for version bump (`pnpm changeset`)
- [ ] PR description explains the changes

### Review Process

1. Submit your PR with a clear description
2. CI will run automated checks
3. Maintainers will review your code
4. Address any feedback
5. Once approved, your PR will be merged

## Changesets

We use [Changesets](https://github.com/changesets/changesets) for version management:

```bash
# Create a changeset
pnpm changeset

# Follow the prompts:
# - Select affected packages
# - Choose version bump type (patch/minor/major)
# - Write a summary of changes
```

**Version Bump Guidelines:**
- `patch` - Bug fixes, documentation updates
- `minor` - New features (backwards compatible)
- `major` - Breaking changes

## Getting Help

- **Questions?** Open a [GitHub Discussion](https://github.com/draco28/ContextAI/discussions)
- **Found a bug?** Open an [Issue](https://github.com/draco28/ContextAI/issues)
- **Security issue?** See [SECURITY.md](./SECURITY.md) (if available) or email directly

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
