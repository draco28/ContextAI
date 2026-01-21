[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [core/src](../README.md) / ImageContentPart

# Interface: ImageContentPart

Defined in: [core/src/provider/types.ts:17](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L17)

Image content part for vision models

## Properties

### type

> **type**: `"image"`

Defined in: [core/src/provider/types.ts:18](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L18)

***

### url?

> `optional` **url**: `string`

Defined in: [core/src/provider/types.ts:20](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L20)

URL of the image (for remote images)

***

### base64?

> `optional` **base64**: `string`

Defined in: [core/src/provider/types.ts:22](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L22)

Base64-encoded image data (for inline images)

***

### mediaType?

> `optional` **mediaType**: `string`

Defined in: [core/src/provider/types.ts:24](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L24)

MIME type (e.g., 'image/png', 'image/jpeg')

***

### detail?

> `optional` **detail**: `"auto"` \| `"low"` \| `"high"`

Defined in: [core/src/provider/types.ts:26](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/provider/types.ts#L26)

Detail level for vision models
