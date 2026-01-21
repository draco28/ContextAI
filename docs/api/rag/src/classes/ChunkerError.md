[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / ChunkerError

# Class: ChunkerError

Defined in: [rag/src/chunking/errors.ts:23](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/chunking/errors.ts#L23)

Error thrown when text chunking fails.

Provides actionable troubleshooting hints based on the error code.

## Example

```typescript
throw ChunkerError.providerRequired('SemanticChunker', 'embeddingProvider');
// Error: SemanticChunker requires embeddingProvider
// Hint: This chunker requires an external provider. Pass it in the constructor.
```

## Extends

- `ContextAIError`

## Constructors

### Constructor

> **new ChunkerError**(`message`, `code`, `chunkerName`, `documentId?`, `cause?`): `ChunkerError`

Defined in: [rag/src/chunking/errors.ts:33](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/chunking/errors.ts#L33)

#### Parameters

##### message

`string`

##### code

[`ChunkerErrorCode`](../type-aliases/ChunkerErrorCode.md)

##### chunkerName

`string`

##### documentId?

`string`

##### cause?

`Error`

#### Returns

`ChunkerError`

#### Overrides

`ContextAIError.constructor`

## Properties

### severity

> `readonly` **severity**: `ErrorSeverity`

Defined in: core/dist/index.d.ts:1164

Error severity level

#### Inherited from

`ContextAIError.severity`

***

### docsUrl?

> `readonly` `optional` **docsUrl**: `string`

Defined in: core/dist/index.d.ts:1166

URL to documentation for this error

#### Inherited from

`ContextAIError.docsUrl`

***

### code

> `readonly` **code**: [`ChunkerErrorCode`](../type-aliases/ChunkerErrorCode.md)

Defined in: [rag/src/chunking/errors.ts:25](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/chunking/errors.ts#L25)

Machine-readable error code

#### Overrides

`ContextAIError.code`

***

### chunkerName

> `readonly` **chunkerName**: `string`

Defined in: [rag/src/chunking/errors.ts:27](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/chunking/errors.ts#L27)

Name of the chunker that failed

***

### documentId?

> `readonly` `optional` **documentId**: `string`

Defined in: [rag/src/chunking/errors.ts:29](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/chunking/errors.ts#L29)

Document ID that was being chunked

***

### cause?

> `readonly` `optional` **cause**: `Error`

Defined in: [rag/src/chunking/errors.ts:31](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/chunking/errors.ts#L31)

Underlying cause, if any

#### Overrides

`ContextAIError.cause`

## Accessors

### isRetryable

#### Get Signature

> **get** **isRetryable**(): `boolean`

Defined in: core/dist/index.d.ts:1178

Whether this error is transient and the operation could succeed if retried.

Override in subclasses to provide specific retry logic.
Examples of retryable errors: rate limits, timeouts, network issues.

##### Returns

`boolean`

`true` if the error is retryable, `false` otherwise

#### Inherited from

`ContextAIError.isRetryable`

***

### retryAfterMs

#### Get Signature

> **get** **retryAfterMs**(): `number`

Defined in: core/dist/index.d.ts:1187

Suggested delay in milliseconds before retrying the operation.

Override in subclasses to provide specific retry delays.
Only meaningful when `isRetryable` returns `true`.

##### Returns

`number`

Delay in ms, or `null` if not retryable

#### Inherited from

`ContextAIError.retryAfterMs`

***

### troubleshootingHint

#### Get Signature

> **get** **troubleshootingHint**(): `string`

Defined in: [rag/src/chunking/errors.ts:51](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/chunking/errors.ts#L51)

Provide actionable troubleshooting hints based on error code.

##### Returns

`string`

#### Overrides

`ContextAIError.troubleshootingHint`

## Methods

### toDetails()

> **toDetails**(): [`ChunkerErrorDetails`](../interfaces/ChunkerErrorDetails.md)

Defined in: [rag/src/chunking/errors.ts:101](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/chunking/errors.ts#L101)

Get error details as a structured object.

#### Returns

[`ChunkerErrorDetails`](../interfaces/ChunkerErrorDetails.md)

***

### emptyDocument()

> `static` **emptyDocument**(`chunkerName`, `documentId?`): `ChunkerError`

Defined in: [rag/src/chunking/errors.ts:117](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/chunking/errors.ts#L117)

Create an error for empty document content.

#### Parameters

##### chunkerName

`string`

##### documentId?

`string`

#### Returns

`ChunkerError`

***

### invalidOptions()

> `static` **invalidOptions**(`chunkerName`, `reason`, `documentId?`): `ChunkerError`

Defined in: [rag/src/chunking/errors.ts:129](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/chunking/errors.ts#L129)

Create an error for invalid chunking options.

#### Parameters

##### chunkerName

`string`

##### reason

`string`

##### documentId?

`string`

#### Returns

`ChunkerError`

***

### chunkTooSmall()

> `static` **chunkTooSmall**(`chunkerName`, `minSize`, `actualSize`, `documentId?`): `ChunkerError`

Defined in: [rag/src/chunking/errors.ts:145](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/chunking/errors.ts#L145)

Create an error when chunk size is too small.

#### Parameters

##### chunkerName

`string`

##### minSize

`number`

##### actualSize

`number`

##### documentId?

`string`

#### Returns

`ChunkerError`

***

### chunkerError()

> `static` **chunkerError**(`chunkerName`, `message`, `documentId?`, `cause?`): `ChunkerError`

Defined in: [rag/src/chunking/errors.ts:162](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/chunking/errors.ts#L162)

Create a generic chunker error.

#### Parameters

##### chunkerName

`string`

##### message

`string`

##### documentId?

`string`

##### cause?

`Error`

#### Returns

`ChunkerError`

***

### configError()

> `static` **configError**(`chunkerName`, `reason`): `ChunkerError`

Defined in: [rag/src/chunking/errors.ts:188](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/chunking/errors.ts#L188)

Create an error for invalid configuration values.

#### Parameters

##### chunkerName

`string`

Name of the chunker with invalid config

##### reason

`string`

Description of what's invalid

#### Returns

`ChunkerError`

#### Example

```typescript
throw ChunkerError.configError('SemanticChunker', 'similarityThreshold must be between 0 and 1');
```

***

### providerRequired()

> `static` **providerRequired**(`chunkerName`, `providerType`): `ChunkerError`

Defined in: [rag/src/chunking/errors.ts:209](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/chunking/errors.ts#L209)

Create an error when a required provider is missing.

#### Parameters

##### chunkerName

`string`

Name of the chunker that needs the provider

##### providerType

`string`

Type of provider needed (e.g., 'embeddingProvider', 'llmProvider')

#### Returns

`ChunkerError`

#### Example

```typescript
if (!config.embeddingProvider) {
  throw ChunkerError.providerRequired('SemanticChunker', 'embeddingProvider');
}
```

***

### llmParseError()

> `static` **llmParseError**(`chunkerName`, `details`, `cause?`): `ChunkerError`

Defined in: [rag/src/chunking/errors.ts:236](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/chunking/errors.ts#L236)

Create an error when LLM response cannot be parsed.

#### Parameters

##### chunkerName

`string`

Name of the chunker that failed to parse

##### details

`string`

Description of what couldn't be parsed

##### cause?

`Error`

Optional underlying parsing error

#### Returns

`ChunkerError`

#### Example

```typescript
try {
  const chunks = JSON.parse(llmResponse);
} catch (e) {
  throw ChunkerError.llmParseError('AgenticChunker', 'Invalid JSON in response', e);
}
```
