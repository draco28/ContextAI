[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [core/src](../README.md) / TraceStats

# Interface: TraceStats

Defined in: [core/src/agent/trace-formatter.ts:140](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/trace-formatter.ts#L140)

Trace statistics

## Properties

### thoughtCount

> **thoughtCount**: `number`

Defined in: [core/src/agent/trace-formatter.ts:142](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/trace-formatter.ts#L142)

Number of thought steps

***

### actionCount

> **actionCount**: `number`

Defined in: [core/src/agent/trace-formatter.ts:144](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/trace-formatter.ts#L144)

Number of action steps

***

### observationCount

> **observationCount**: `number`

Defined in: [core/src/agent/trace-formatter.ts:146](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/trace-formatter.ts#L146)

Number of observation steps

***

### successfulTools

> **successfulTools**: `number`

Defined in: [core/src/agent/trace-formatter.ts:148](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/trace-formatter.ts#L148)

Number of successful tool executions

***

### failedTools

> **failedTools**: `number`

Defined in: [core/src/agent/trace-formatter.ts:150](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/trace-formatter.ts#L150)

Number of failed tool executions

***

### tokensPerIteration

> **tokensPerIteration**: `number`

Defined in: [core/src/agent/trace-formatter.ts:152](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/trace-formatter.ts#L152)

Average tokens per iteration

***

### totalDurationMs

> **totalDurationMs**: `number`

Defined in: [core/src/agent/trace-formatter.ts:154](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/trace-formatter.ts#L154)

Total duration in milliseconds
