[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / Document

# Interface: Document

Defined in: [rag/src/loaders/types.ts:42](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/loaders/types.ts#L42)

A loaded document ready for processing.

Documents are the output of loaders and the input to chunkers.

## Properties

### id

> **id**: `string`

Defined in: [rag/src/loaders/types.ts:44](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/loaders/types.ts#L44)

Unique identifier for this document

***

### content

> **content**: `string`

Defined in: [rag/src/loaders/types.ts:46](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/loaders/types.ts#L46)

The text content of the document

***

### metadata

> **metadata**: [`DocumentMetadata`](DocumentMetadata.md)

Defined in: [rag/src/loaders/types.ts:48](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/loaders/types.ts#L48)

Extracted metadata

***

### source

> **source**: `string`

Defined in: [rag/src/loaders/types.ts:50](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/loaders/types.ts#L50)

Original source path or identifier
