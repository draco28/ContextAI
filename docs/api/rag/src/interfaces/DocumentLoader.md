[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / DocumentLoader

# Interface: DocumentLoader

Defined in: [rag/src/loaders/types.ts:98](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/loaders/types.ts#L98)

Interface for document loaders.

Loaders are responsible for:
1. Detecting if they can handle a source (canLoad)
2. Loading and parsing the source into Documents (load)

## Example

```typescript
const loader: DocumentLoader = new MarkdownLoader();

if (loader.canLoad('readme.md')) {
  const docs = await loader.load('readme.md', {
    allowedDirectories: ['/app/docs']
  });
}
```

## Properties

### name

> `readonly` **name**: `string`

Defined in: [rag/src/loaders/types.ts:100](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/loaders/types.ts#L100)

Human-readable name of this loader

***

### supportedFormats

> `readonly` **supportedFormats**: `string`[]

Defined in: [rag/src/loaders/types.ts:103](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/loaders/types.ts#L103)

File extensions this loader supports (e.g., ['.md', '.markdown'])

## Methods

### canLoad()

> **canLoad**(`source`): `boolean`

Defined in: [rag/src/loaders/types.ts:114](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/loaders/types.ts#L114)

Check if this loader can handle the given source.

For file paths, checks the extension.
For buffers, may inspect magic bytes.

#### Parameters

##### source

File path or buffer to check

`string` | `Buffer`\<`ArrayBufferLike`\>

#### Returns

`boolean`

true if this loader can handle the source

***

### load()

> **load**(`source`, `options?`): `Promise`\<[`Document`](Document.md)[]\>

Defined in: [rag/src/loaders/types.ts:125](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/loaders/types.ts#L125)

Load and parse a document from the source.

#### Parameters

##### source

File path or buffer to load

`string` | `Buffer`\<`ArrayBufferLike`\>

##### options?

[`LoadOptions`](LoadOptions.md)

Loading options (required for file paths)

#### Returns

`Promise`\<[`Document`](Document.md)[]\>

Array of documents (some formats yield multiple docs)

#### Throws

If loading fails

#### Throws

If path validation fails
