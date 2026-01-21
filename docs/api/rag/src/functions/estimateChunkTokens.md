[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / estimateChunkTokens

# Function: estimateChunkTokens()

> **estimateChunkTokens**(`chunk`, `formattingOverhead`): `number`

Defined in: [rag/src/assembly/token-budget.ts:59](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/token-budget.ts#L59)

Estimate tokens for a chunk including metadata formatting overhead.

Accounts for the additional tokens used by source attribution
and formatting (XML tags, markdown markers, etc.).

## Parameters

### chunk

[`Chunk`](../interfaces/Chunk.md)

Chunk to estimate

### formattingOverhead

`number` = `50`

Extra characters for formatting (default: 50)

## Returns

`number`

Estimated total token count
