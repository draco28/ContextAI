[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [core/src](../README.md) / Logger

# Interface: Logger

Defined in: [core/src/agent/types.ts:255](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/types.ts#L255)

Logger interface - plug in any logging implementation

Follows common logging library patterns (pino, winston, console)

## Example

```typescript
const agent = new Agent({
  // ...
  logger: {
    debug: (msg, meta) => console.debug(msg, meta),
    info: (msg, meta) => console.info(msg, meta),
    warn: (msg, meta) => console.warn(msg, meta),
    error: (msg, meta) => console.error(msg, meta),
  },
});
```

## Methods

### debug()

> **debug**(`message`, `meta?`): `void`

Defined in: [core/src/agent/types.ts:256](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/types.ts#L256)

#### Parameters

##### message

`string`

##### meta?

`Record`\<`string`, `unknown`\>

#### Returns

`void`

***

### info()

> **info**(`message`, `meta?`): `void`

Defined in: [core/src/agent/types.ts:257](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/types.ts#L257)

#### Parameters

##### message

`string`

##### meta?

`Record`\<`string`, `unknown`\>

#### Returns

`void`

***

### warn()

> **warn**(`message`, `meta?`): `void`

Defined in: [core/src/agent/types.ts:258](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/types.ts#L258)

#### Parameters

##### message

`string`

##### meta?

`Record`\<`string`, `unknown`\>

#### Returns

`void`

***

### error()

> **error**(`message`, `meta?`): `void`

Defined in: [core/src/agent/types.ts:259](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/types.ts#L259)

#### Parameters

##### message

`string`

##### meta?

`Record`\<`string`, `unknown`\>

#### Returns

`void`
