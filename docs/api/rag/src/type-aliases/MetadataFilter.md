[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / MetadataFilter

# Type Alias: MetadataFilter

> **MetadataFilter** = `object`

Defined in: [rag/src/vector-store/types.ts:90](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/vector-store/types.ts#L90)

Metadata filter for search queries.

Supports equality checks and operators:
- Direct value: exact match
- $in: value in array
- $gt, $gte, $lt, $lte: numeric comparisons
- $ne: not equal

## Index Signature

\[`key`: `string`\]: `string` \| `number` \| `boolean` \| [`FilterOperator`](FilterOperator.md)

## Example

```typescript
const filter: MetadataFilter = {
  documentId: 'doc-123',           // exact match
  pageNumber: { $gte: 5 },         // page >= 5
  category: { $in: ['tech', 'ai'] } // category is tech or ai
};
```
