[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [provider-ollama/src](../README.md) / mapOllamaError

# Function: mapOllamaError()

> **mapOllamaError**(`error`): [`OllamaProviderError`](../classes/OllamaProviderError.md)

Defined in: [provider-ollama/src/errors.ts:116](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-ollama/src/errors.ts#L116)

Maps fetch/API errors to our standardized error type.

## Parameters

### error

`unknown`

The error from fetch or Ollama API

## Returns

[`OllamaProviderError`](../classes/OllamaProviderError.md)

A standardized OllamaProviderError
