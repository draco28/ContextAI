[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / truncateText

# Function: truncateText()

> **truncateText**(`text`, `maxChars`): `string`

Defined in: [rag/src/assembly/token-budget.ts:211](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/token-budget.ts#L211)

Truncate text to approximately the target character count.

Tries to break at word boundaries for readability.
Adds ellipsis to indicate truncation.

## Parameters

### text

`string`

Text to truncate

### maxChars

`number`

Maximum characters (including ellipsis)

## Returns

`string`

Truncated text with ellipsis
