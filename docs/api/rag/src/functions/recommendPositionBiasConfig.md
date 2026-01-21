[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / recommendPositionBiasConfig

# Function: recommendPositionBiasConfig()

> **recommendPositionBiasConfig**(`contextSize`): [`PositionBiasConfig`](../interfaces/PositionBiasConfig.md)

Defined in: [rag/src/reranker/position-bias.ts:248](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/reranker/position-bias.ts#L248)

Create a position bias configuration based on context size.

Larger contexts benefit more from aggressive position bias mitigation.

## Parameters

### contextSize

`number`

Number of documents in context

## Returns

[`PositionBiasConfig`](../interfaces/PositionBiasConfig.md)

Recommended configuration
