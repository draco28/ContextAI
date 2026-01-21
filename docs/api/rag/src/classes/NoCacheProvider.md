[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / NoCacheProvider

# Class: NoCacheProvider\<T\>

Defined in: [rag/src/cache/no-cache.ts:43](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/cache/no-cache.ts#L43)

A cache provider that performs no caching (Null Object Pattern).

All operations succeed but have no effect:
- `get()` always returns `undefined`
- `set()` does nothing
- `has()` always returns `false`
- `delete()` always returns `false`

Use cases:
- Unit testing without caching side effects
- Benchmarking to compare cached vs uncached performance
- Runtime cache disable flag (`cache: enabled ? new LRUCacheProvider() : new NoCacheProvider()`)
- Development mode to ensure fresh data on every request

## Example

```typescript
// Disable caching based on environment
const cache: CacheProvider<EmbeddingResult> = process.env.DISABLE_CACHE
  ? new NoCacheProvider()
  : new LRUCacheProvider({ maxSize: 1000 });

// Use identically - no conditional logic needed
await cache.set('key', value);
const result = await cache.get('key'); // Always undefined with NoCacheProvider
```

## Type Parameters

### T

`T` = `unknown`

The type of values (unused but required for type compatibility)

## Implements

- [`CacheProvider`](../interfaces/CacheProvider.md)\<`T`\>

## Constructors

### Constructor

> **new NoCacheProvider**\<`T`\>(): `NoCacheProvider`\<`T`\>

#### Returns

`NoCacheProvider`\<`T`\>

## Methods

### get()

> **get**(`_key`): `Promise`\<`T`\>

Defined in: [rag/src/cache/no-cache.ts:50](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/cache/no-cache.ts#L50)

Always returns `undefined` (cache miss).

#### Parameters

##### \_key

`string`

#### Returns

`Promise`\<`T`\>

#### Implementation of

[`CacheProvider`](../interfaces/CacheProvider.md).[`get`](../interfaces/CacheProvider.md#get)

***

### set()

> **set**(`_key`, `_value`, `_ttl?`): `Promise`\<`void`\>

Defined in: [rag/src/cache/no-cache.ts:58](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/cache/no-cache.ts#L58)

Does nothing (no-op).

#### Parameters

##### \_key

`string`

##### \_value

`T`

##### \_ttl?

`number`

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`CacheProvider`](../interfaces/CacheProvider.md).[`set`](../interfaces/CacheProvider.md#set)

***

### delete()

> **delete**(`_key`): `Promise`\<`boolean`\>

Defined in: [rag/src/cache/no-cache.ts:65](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/cache/no-cache.ts#L65)

Always returns `false` (nothing to delete).

#### Parameters

##### \_key

`string`

#### Returns

`Promise`\<`boolean`\>

#### Implementation of

[`CacheProvider`](../interfaces/CacheProvider.md).[`delete`](../interfaces/CacheProvider.md#delete)

***

### has()

> **has**(`_key`): `Promise`\<`boolean`\>

Defined in: [rag/src/cache/no-cache.ts:72](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/cache/no-cache.ts#L72)

Always returns `false` (cache is always empty).

#### Parameters

##### \_key

`string`

#### Returns

`Promise`\<`boolean`\>

#### Implementation of

[`CacheProvider`](../interfaces/CacheProvider.md).[`has`](../interfaces/CacheProvider.md#has)

***

### clear()

> **clear**(): `Promise`\<`void`\>

Defined in: [rag/src/cache/no-cache.ts:79](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/cache/no-cache.ts#L79)

Resets access count (no-op for actual clearing).

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`CacheProvider`](../interfaces/CacheProvider.md).[`clear`](../interfaces/CacheProvider.md#clear)

***

### size()

> **size**(): `number`

Defined in: [rag/src/cache/no-cache.ts:86](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/cache/no-cache.ts#L86)

Always returns 0 (cache is always empty).

#### Returns

`number`

***

### getStats()

> **getStats**(): [`CacheStats`](../interfaces/CacheStats.md)

Defined in: [rag/src/cache/no-cache.ts:98](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/cache/no-cache.ts#L98)

Get cache statistics.

- hits: always 0 (nothing is ever cached)
- misses: count of `get()` calls
- size: always 0
- hitRate: always 0

#### Returns

[`CacheStats`](../interfaces/CacheStats.md)

***

### resetStats()

> **resetStats**(): `void`

Defined in: [rag/src/cache/no-cache.ts:110](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/cache/no-cache.ts#L110)

Reset statistics.

#### Returns

`void`
