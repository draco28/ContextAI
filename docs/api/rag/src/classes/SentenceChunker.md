[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / SentenceChunker

# Class: SentenceChunker

Defined in: [rag/src/chunking/sentence-chunker.ts:47](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/chunking/sentence-chunker.ts#L47)

Sentence-based chunking strategy.

Splits text into sentences, then groups sentences together until
the target chunk size is reached. Guarantees complete sentences
in every chunk.

Best for:
- Natural language text (articles, documentation)
- When sentence integrity is critical for meaning
- Question-answering systems where complete thoughts matter

## Example

```typescript
const chunker = new SentenceChunker();

const chunks = await chunker.chunk(document, {
  chunkSize: 512,
  chunkOverlap: 50  // Overlap in sentences, not tokens
});
```

## Extends

- [`BaseChunker`](BaseChunker.md)

## Constructors

### Constructor

> **new SentenceChunker**(): `SentenceChunker`

#### Returns

`SentenceChunker`

#### Inherited from

[`BaseChunker`](BaseChunker.md).[`constructor`](BaseChunker.md#constructor)

## Properties

### name

> `readonly` **name**: `"SentenceChunker"` = `'SentenceChunker'`

Defined in: [rag/src/chunking/sentence-chunker.ts:48](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/chunking/sentence-chunker.ts#L48)

Human-readable name of this chunker

#### Overrides

[`BaseChunker`](BaseChunker.md).[`name`](BaseChunker.md#name)

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

#### Inherited from

[`BaseChunker`](BaseChunker.md).[`chunk`](BaseChunker.md#chunk)
