[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / LoadOptions

# Interface: LoadOptions

Defined in: [rag/src/loaders/types.ts:60](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/loaders/types.ts#L60)

Options for loading documents.

## Indexable

\[`key`: `string`\]: `unknown`

Loader-specific options

## Properties

### allowedDirectories?

> `optional` **allowedDirectories**: `string`[]

Defined in: [rag/src/loaders/types.ts:65](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/loaders/types.ts#L65)

Base directories allowed for file loading.
Required for path-based sources to prevent traversal attacks.

***

### followSymlinks?

> `optional` **followSymlinks**: `boolean`

Defined in: [rag/src/loaders/types.ts:67](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/loaders/types.ts#L67)

Whether to follow symlinks (default: false)

***

### encoding?

> `optional` **encoding**: `BufferEncoding`

Defined in: [rag/src/loaders/types.ts:69](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/loaders/types.ts#L69)

Encoding for text files (default: 'utf-8')

***

### maxFileSize?

> `optional` **maxFileSize**: `number`

Defined in: [rag/src/loaders/types.ts:71](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/loaders/types.ts#L71)

Maximum file size in bytes (default: 10MB)
