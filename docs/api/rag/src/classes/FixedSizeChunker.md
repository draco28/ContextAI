[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / FixedSizeChunker

# Class: FixedSizeChunker

Defined in: [rag/src/chunking/fixed-chunker.ts:34](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/chunking/fixed-chunker.ts#L34)

Fixed-size chunking strategy.

Splits text by token or character count with configurable overlap.
Does not respect semantic boundaries (sentences, paragraphs).

Best for:
- Uniform chunk sizes (important for some embedding models)
- Simple baseline when semantic chunking isn't needed
- Code or structured data where natural boundaries are unclear

## Example

```typescript
const chunker = new FixedSizeChunker();

const chunks = await chunker.chunk(document, {
  chunkSize: 512,      // 512 tokens per chunk
  chunkOverlap: 50,    // 50 token overlap
  sizeUnit: 'tokens'
});
```

## Extends

- [`BaseChunker`](BaseChunker.md)

## Constructors

### Constructor

> **new FixedSizeChunker**(): `FixedSizeChunker`

#### Returns

`FixedSizeChunker`

#### Inherited from

[`BaseChunker`](BaseChunker.md).[`constructor`](BaseChunker.md#constructor)

## Properties

### name

> `readonly` **name**: `"FixedSizeChunker"` = `'FixedSizeChunker'`

Defined in: [rag/src/chunking/fixed-chunker.ts:35](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/chunking/fixed-chunker.ts#L35)

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
