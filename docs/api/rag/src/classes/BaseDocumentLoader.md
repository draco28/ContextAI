[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / BaseDocumentLoader

# Abstract Class: BaseDocumentLoader

Defined in: [rag/src/loaders/base-loader.ts:50](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/loaders/base-loader.ts#L50)

Abstract base class for document loaders.

Provides:
- Path validation (security)
- File reading with size limits
- ID generation
- Extension-based format detection
- Word counting utility

Subclasses must implement:
- `parseContent()` - Format-specific parsing logic

## Example

```typescript
class MarkdownLoader extends BaseDocumentLoader {
  readonly name = 'MarkdownLoader';
  readonly supportedFormats = ['.md', '.markdown'];

  protected async parseContent(content: string, source: string): Promise<Document[]> {
    // Parse markdown and return documents
  }
}
```

## Implements

- [`DocumentLoader`](../interfaces/DocumentLoader.md)

## Constructors

### Constructor

> **new BaseDocumentLoader**(): `BaseDocumentLoader`

#### Returns

`BaseDocumentLoader`

## Properties

### name

> `abstract` `readonly` **name**: `string`

Defined in: [rag/src/loaders/base-loader.ts:52](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/loaders/base-loader.ts#L52)

Human-readable name of this loader

#### Implementation of

[`DocumentLoader`](../interfaces/DocumentLoader.md).[`name`](../interfaces/DocumentLoader.md#name)

***

### supportedFormats

> `abstract` `readonly` **supportedFormats**: `string`[]

Defined in: [rag/src/loaders/base-loader.ts:55](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/loaders/base-loader.ts#L55)

File extensions this loader supports

#### Implementation of

[`DocumentLoader`](../interfaces/DocumentLoader.md).[`supportedFormats`](../interfaces/DocumentLoader.md#supportedformats)

## Methods

### canLoad()

> **canLoad**(`source`): `boolean`

Defined in: [rag/src/loaders/base-loader.ts:63](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/loaders/base-loader.ts#L63)

Check if this loader can handle the given source.

For strings, checks if the extension matches supportedFormats.
For buffers, returns false by default (override for magic byte detection).

#### Parameters

##### source

`string` | `Buffer`\<`ArrayBufferLike`\>

#### Returns

`boolean`

#### Implementation of

[`DocumentLoader`](../interfaces/DocumentLoader.md).[`canLoad`](../interfaces/DocumentLoader.md#canload)

***

### load()

> **load**(`source`, `options?`): `Promise`\<[`Document`](../interfaces/Document.md)[]\>

Defined in: [rag/src/loaders/base-loader.ts:78](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/loaders/base-loader.ts#L78)

Load and parse a document from the source.

Handles path validation, file reading, and delegates parsing to subclass.

#### Parameters

##### source

`string` | `Buffer`\<`ArrayBufferLike`\>

##### options?

[`LoadOptions`](../interfaces/LoadOptions.md)

#### Returns

`Promise`\<[`Document`](../interfaces/Document.md)[]\>

#### Implementation of

[`DocumentLoader`](../interfaces/DocumentLoader.md).[`load`](../interfaces/DocumentLoader.md#load)
