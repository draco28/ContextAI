[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [provider-anthropic/src](../README.md) / mapTools

# Function: mapTools()

> **mapTools**(`tools`): `Tool`[]

Defined in: [provider-anthropic/src/message-mapper.ts:354](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-anthropic/src/message-mapper.ts#L354)

Maps ContextAI ToolDefinition array to Anthropic Tool array.

Anthropic's tool format:
{
  name: string,
  description: string,
  input_schema: JSONSchema  // Note: input_schema, not parameters
}

## Parameters

### tools

`ToolDefinition`[]

## Returns

`Tool`[]
