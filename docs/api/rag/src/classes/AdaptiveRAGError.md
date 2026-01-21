[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / AdaptiveRAGError

# Class: AdaptiveRAGError

Defined in: [rag/src/adaptive/errors.ts:28](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/errors.ts#L28)

Error thrown by adaptive RAG components.

Includes an error code for programmatic handling and
optional cause for debugging nested failures.

## Example

```typescript
try {
  await adaptiveRag.search('...');
} catch (error) {
  if (error instanceof AdaptiveRAGError) {
    console.log(error.code); // 'UNDERLYING_ENGINE_ERROR'
    console.log(error.cause); // Original error
  }
}
```

## Extends

- `Error`

## Constructors

### Constructor

> **new AdaptiveRAGError**(`message`, `details`): `AdaptiveRAGError`

Defined in: [rag/src/adaptive/errors.ts:38](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/errors.ts#L38)

#### Parameters

##### message

`string`

##### details

[`AdaptiveRAGErrorDetails`](../interfaces/AdaptiveRAGErrorDetails.md)

#### Returns

`AdaptiveRAGError`

#### Overrides

`Error.constructor`

## Properties

### code

> `readonly` **code**: [`AdaptiveRAGErrorCode`](../type-aliases/AdaptiveRAGErrorCode.md)

Defined in: [rag/src/adaptive/errors.ts:30](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/errors.ts#L30)

Machine-readable error code

***

### componentName

> `readonly` **componentName**: `string`

Defined in: [rag/src/adaptive/errors.ts:32](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/errors.ts#L32)

Name of the component that failed

***

### queryType?

> `readonly` `optional` **queryType**: [`QueryType`](../type-aliases/QueryType.md)

Defined in: [rag/src/adaptive/errors.ts:34](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/errors.ts#L34)

Query type at time of failure (if classified)

***

### cause?

> `readonly` `optional` **cause**: `Error`

Defined in: [rag/src/adaptive/errors.ts:36](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/errors.ts#L36)

Underlying cause, if any

## Methods

### toDetailedString()

> **toDetailedString**(): `string`

Defined in: [rag/src/adaptive/errors.ts:55](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/adaptive/errors.ts#L55)

Create a user-friendly error message with context.

#### Returns

`string`
