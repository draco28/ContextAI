[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / DocumentMetadata

# Interface: DocumentMetadata

Defined in: [rag/src/loaders/types.ts:18](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/loaders/types.ts#L18)

Metadata extracted from a document.

Common fields are strongly typed; loaders can add custom fields
via the index signature.

## Indexable

\[`key`: `string`\]: `unknown`

Allow loader-specific custom fields

## Properties

### title?

> `optional` **title**: `string`

Defined in: [rag/src/loaders/types.ts:20](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/loaders/types.ts#L20)

Document title, if available

***

### author?

> `optional` **author**: `string`

Defined in: [rag/src/loaders/types.ts:22](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/loaders/types.ts#L22)

Document author, if available

***

### createdAt?

> `optional` **createdAt**: `Date`

Defined in: [rag/src/loaders/types.ts:24](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/loaders/types.ts#L24)

When the document was created

***

### modifiedAt?

> `optional` **modifiedAt**: `Date`

Defined in: [rag/src/loaders/types.ts:26](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/loaders/types.ts#L26)

When the document was last modified

***

### mimeType?

> `optional` **mimeType**: `string`

Defined in: [rag/src/loaders/types.ts:28](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/loaders/types.ts#L28)

MIME type of the source (e.g., "application/pdf")

***

### pageCount?

> `optional` **pageCount**: `number`

Defined in: [rag/src/loaders/types.ts:30](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/loaders/types.ts#L30)

Number of pages (for paginated documents)

***

### wordCount?

> `optional` **wordCount**: `number`

Defined in: [rag/src/loaders/types.ts:32](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/loaders/types.ts#L32)

Approximate word count
