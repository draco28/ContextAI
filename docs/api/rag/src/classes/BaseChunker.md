[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / BaseChunker

# Abstract Class: BaseChunker

Defined in: [rag/src/chunking/base-chunker.ts:48](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/chunking/base-chunker.ts#L48)

Abstract base class for text chunkers.

Provides:
- Options validation and merging
- Chunk ID generation (deterministic)
- Metadata handling
- Context header generation

Subclasses must implement:
- `_chunk()` - Strategy-specific splitting logic

## Example

```typescript
class MyChunker extends BaseChunker {
  readonly name = 'MyChunker';

  protected async _chunk(
    document: Document,
    options: Required<ChunkingOptions>
  ): Promise<Chunk[]> {
    // Implement splitting logic
  }
}
```

## Extended by

- [`FixedSizeChunker`](FixedSizeChunker.md)
- [`RecursiveChunker`](RecursiveChunker.md)
- [`SentenceChunker`](SentenceChunker.md)

## Implements

- [`ChunkingStrategy`](../interfaces/ChunkingStrategy.md)

## Constructors

### Constructor

> **new BaseChunker**(): `BaseChunker`

#### Returns

`BaseChunker`

## Properties

### name

> `abstract` `readonly` **name**: `string`

Defined in: [rag/src/chunking/base-chunker.ts:50](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/chunking/base-chunker.ts#L50)

Human-readable name of this chunker

#### Implementation of

[`ChunkingStrategy`](../interfaces/ChunkingStrategy.md).[`name`](../interfaces/ChunkingStrategy.md#name)

## Methods

### chunk()

> **chunk**(`document`, `options?`): `Promise`\<[`Chunk`](../interfaces/Chunk.md)[]\>

Defined in: [rag/src/chunking/base-chunker.ts:58](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/chunking/base-chunker.ts#L58)

Split a document into chunks.

Validates inputs, merges options with defaults, then delegates
to the subclass implementation.

#### Parameters

##### document

[`Document`](../interfaces/Document.md)

##### options?

[`ChunkingOptions`](../interfaces/ChunkingOptions.md)

#### Returns

`Promise`\<[`Chunk`](../interfaces/Chunk.md)[]\>

#### Implementation of

[`ChunkingStrategy`](../interfaces/ChunkingStrategy.md).[`chunk`](../interfaces/ChunkingStrategy.md#chunk)
