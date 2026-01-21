[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [core/src](../README.md) / ReActEventCallbacks

# Interface: ReActEventCallbacks

Defined in: [core/src/agent/types.ts:223](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/types.ts#L223)

Event callbacks configuration for real-time debugging

## Example

```typescript
const agent = new Agent({
  // ...
  callbacks: {
    onThought: (e) => console.log('Thinking:', e.content),
    onAction: (e) => console.log('Using tool:', e.tool),
    onObservation: (e) => console.log('Result:', e.result),
  },
});
```

## Properties

### onThought?

> `optional` **onThought**: [`OnThoughtCallback`](../type-aliases/OnThoughtCallback.md)

Defined in: [core/src/agent/types.ts:224](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/types.ts#L224)

***

### onAction?

> `optional` **onAction**: [`OnActionCallback`](../type-aliases/OnActionCallback.md)

Defined in: [core/src/agent/types.ts:225](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/types.ts#L225)

***

### onObservation?

> `optional` **onObservation**: [`OnObservationCallback`](../type-aliases/OnObservationCallback.md)

Defined in: [core/src/agent/types.ts:226](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/types.ts#L226)

***

### onToolCall?

> `optional` **onToolCall**: [`OnToolCallCallback`](../type-aliases/OnToolCallCallback.md)

Defined in: [core/src/agent/types.ts:227](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/core/src/agent/types.ts#L227)
