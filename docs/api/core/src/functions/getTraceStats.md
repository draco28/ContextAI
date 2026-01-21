[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [core/src](../README.md) / getTraceStats

# Function: getTraceStats()

> **getTraceStats**(`trace`): [`TraceStats`](../interfaces/TraceStats.md)

Defined in: [core/src/agent/trace-formatter.ts:166](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/trace-formatter.ts#L166)

Calculate trace statistics

## Parameters

### trace

[`ReActTrace`](../interfaces/ReActTrace.md)

## Returns

[`TraceStats`](../interfaces/TraceStats.md)

## Example

```typescript
const stats = getTraceStats(response.trace);
console.log(`Tools: ${stats.successfulTools}/${stats.actionCount} succeeded`);
```
