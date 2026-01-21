[**ContextAI SDK**](../../README.md)

***

[ContextAI SDK](../../README.md) / provider-ollama/src

# provider-ollama/src

@contextai/provider-ollama

Ollama local LLM provider for ContextAI SDK.

Supports local models like Llama 3, Mistral, CodeLlama, and more
via the Ollama server. No API key required - run LLMs locally!

## Example

```typescript
import { OllamaProvider, OllamaModels } from '@contextai/provider-ollama';

const provider = new OllamaProvider({
  model: OllamaModels.LLAMA_3_2,
  host: 'http://localhost:11434',
});

// Check if Ollama is running
if (await provider.isAvailable()) {
  const response = await provider.chat([
    { role: 'user', content: 'Hello!' }
  ]);
  console.log(response.content);
} else {
  console.log('Start Ollama with: ollama serve');
}
```

## Classes

- [OllamaProviderError](classes/OllamaProviderError.md)
- [OllamaProvider](classes/OllamaProvider.md)

## Interfaces

- [OllamaProviderConfig](interfaces/OllamaProviderConfig.md)

## Type Aliases

- [OllamaErrorCode](type-aliases/OllamaErrorCode.md)
- [OllamaModelId](type-aliases/OllamaModelId.md)

## Variables

- [OllamaModels](variables/OllamaModels.md)

## Functions

- [mapOllamaError](functions/mapOllamaError.md)
