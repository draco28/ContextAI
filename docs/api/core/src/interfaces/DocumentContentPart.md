[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [core/src](../README.md) / DocumentContentPart

# Interface: DocumentContentPart

Defined in: [core/src/provider/types.ts:32](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L32)

Document content part for file inputs (e.g., PDFs)

## Properties

### type

> **type**: `"document"`

Defined in: [core/src/provider/types.ts:33](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L33)

***

### url?

> `optional` **url**: `string`

Defined in: [core/src/provider/types.ts:35](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L35)

URL of the document

***

### base64?

> `optional` **base64**: `string`

Defined in: [core/src/provider/types.ts:37](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L37)

Base64-encoded document data

***

### mediaType?

> `optional` **mediaType**: `string`

Defined in: [core/src/provider/types.ts:39](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L39)

MIME type (e.g., 'application/pdf')
