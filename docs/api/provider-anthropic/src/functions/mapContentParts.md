[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [provider-anthropic/src](../README.md) / mapContentParts

# Function: mapContentParts()

> **mapContentParts**(`parts`): `ContentBlockParam`[]

Defined in: [provider-anthropic/src/message-mapper.ts:250](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/provider-anthropic/src/message-mapper.ts#L250)

Maps ContextAI ContentPart array to Anthropic content blocks.

Supports:
- Text parts
- Image parts (base64 or URL - URLs converted to base64 note)
- Document parts (limited support)

## Parameters

### parts

`ContentPart`[]

## Returns

`ContentBlockParam`[]
