[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / tokenizeForDedup

# Function: tokenizeForDedup()

> **tokenizeForDedup**(`text`): `Set`\<`string`\>

Defined in: [rag/src/assembly/deduplication.ts:79](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/deduplication.ts#L79)

Tokenize text into a set of normalized words.

Normalizes by:
- Converting to lowercase
- Removing punctuation
- Filtering out very short words (< 2 chars)

## Parameters

### text

`string`

Text to tokenize

## Returns

`Set`\<`string`\>

Set of normalized words
