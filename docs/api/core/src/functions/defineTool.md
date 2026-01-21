[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [core/src](../README.md) / defineTool

# Function: defineTool()

> **defineTool**\<`TInput`, `TOutput`\>(`config`): [`Tool`](../interfaces/Tool.md)\<`TInput`, `TOutput`\>

Defined in: [core/src/tool/tool.ts:35](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/tool/tool.ts#L35)

Define a type-safe tool with Zod validation

## Type Parameters

### TInput

`TInput` *extends* `ZodType`\<`any`, `ZodTypeDef`, `any`\>

### TOutput

`TOutput` = `unknown`

## Parameters

### config

[`ToolConfig`](../interfaces/ToolConfig.md)\<`TInput`, `TOutput`\>

## Returns

[`Tool`](../interfaces/Tool.md)\<`TInput`, `TOutput`\>

## Example

```typescript
const searchTool = defineTool({
  name: 'search',
  description: 'Search for information',
  parameters: z.object({
    query: z.string().describe('Search query'),
    limit: z.number().optional().default(10),
  }),
  execute: async ({ query, limit }) => {
    const results = await search(query, limit);
    return { success: true, data: results };
  },
});
```
