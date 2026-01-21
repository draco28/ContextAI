[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [core/src](../README.md) / TraceFormatOptions

# Interface: TraceFormatOptions

Defined in: [core/src/agent/trace-formatter.ts:6](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/trace-formatter.ts#L6)

Format options for trace output

## Properties

### timestamps?

> `optional` **timestamps**: `boolean`

Defined in: [core/src/agent/trace-formatter.ts:8](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/trace-formatter.ts#L8)

Include timestamps (default: true)

***

### iterations?

> `optional` **iterations**: `boolean`

Defined in: [core/src/agent/trace-formatter.ts:10](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/trace-formatter.ts#L10)

Include iteration numbers (default: true)

***

### colors?

> `optional` **colors**: `boolean`

Defined in: [core/src/agent/trace-formatter.ts:12](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/trace-formatter.ts#L12)

Colorize output with ANSI codes (default: false)

***

### indent?

> `optional` **indent**: `number`

Defined in: [core/src/agent/trace-formatter.ts:14](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/trace-formatter.ts#L14)

Indent size in spaces (default: 2)

***

### maxResultLength?

> `optional` **maxResultLength**: `number`

Defined in: [core/src/agent/trace-formatter.ts:16](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/trace-formatter.ts#L16)

Max result length before truncation (default: 200)
