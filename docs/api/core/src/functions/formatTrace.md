[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [core/src](../README.md) / formatTrace

# Function: formatTrace()

> **formatTrace**(`trace`, `options`): `string`

Defined in: [core/src/agent/trace-formatter.ts:46](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/trace-formatter.ts#L46)

Format a ReAct trace for human-readable output

## Parameters

### trace

[`ReActTrace`](../interfaces/ReActTrace.md)

### options

[`TraceFormatOptions`](../interfaces/TraceFormatOptions.md) = `{}`

## Returns

`string`

## Example

```typescript
const formatted = formatTrace(response.trace, { colors: true });
console.log(formatted);
```
