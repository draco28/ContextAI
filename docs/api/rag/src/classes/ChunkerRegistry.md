[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / ChunkerRegistry

# Class: ChunkerRegistry

Defined in: [rag/src/chunking/registry.ts:32](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/chunking/registry.ts#L32)

Registry for managing chunking strategies.

Provides centralized registration and lookup of chunkers by name.
A default instance is exported with built-in strategies pre-registered.

## Example

```typescript
// Use default registry with built-in chunkers
import { defaultChunkerRegistry } from '@contextai/rag';

const chunker = defaultChunkerRegistry.get('RecursiveChunker');
const chunks = await chunker.chunk(document);

// Or create custom registry
const registry = new ChunkerRegistry();
registry.register(new MyCustomChunker());
```

## Constructors

### Constructor

> **new ChunkerRegistry**(): `ChunkerRegistry`

#### Returns

`ChunkerRegistry`

## Methods

### register()

> **register**(`chunker`): `void`

Defined in: [rag/src/chunking/registry.ts:42](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/chunking/registry.ts#L42)

Register a chunking strategy.

#### Parameters

##### chunker

[`ChunkingStrategy`](../interfaces/ChunkingStrategy.md)

The chunker to register

#### Returns

`void`

#### Throws

If a chunker with the same name is already registered

***

### unregister()

> **unregister**(`name`): `boolean`

Defined in: [rag/src/chunking/registry.ts:55](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/chunking/registry.ts#L55)

Unregister a chunking strategy by name.

#### Parameters

##### name

`string`

Name of the chunker to remove

#### Returns

`boolean`

true if removed, false if not found

***

### get()

> **get**(`name`): [`ChunkingStrategy`](../interfaces/ChunkingStrategy.md)

Defined in: [rag/src/chunking/registry.ts:65](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/chunking/registry.ts#L65)

Get a chunker by name.

#### Parameters

##### name

`string`

Name of the chunker to retrieve

#### Returns

[`ChunkingStrategy`](../interfaces/ChunkingStrategy.md)

The chunker, or undefined if not found

***

### getOrThrow()

> **getOrThrow**(`name`): [`ChunkingStrategy`](../interfaces/ChunkingStrategy.md)

Defined in: [rag/src/chunking/registry.ts:76](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/chunking/registry.ts#L76)

Get a chunker by name, throwing if not found.

#### Parameters

##### name

`string`

Name of the chunker to retrieve

#### Returns

[`ChunkingStrategy`](../interfaces/ChunkingStrategy.md)

The chunker

#### Throws

If chunker not found

***

### has()

> **has**(`name`): `boolean`

Defined in: [rag/src/chunking/registry.ts:90](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/chunking/registry.ts#L90)

Check if a chunker is registered.

#### Parameters

##### name

`string`

Name to check

#### Returns

`boolean`

true if registered

***

### getNames()

> **getNames**(): `string`[]

Defined in: [rag/src/chunking/registry.ts:99](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/chunking/registry.ts#L99)

Get all registered chunker names.

#### Returns

`string`[]

Array of chunker names

***

### getAll()

> **getAll**(): [`ChunkingStrategy`](../interfaces/ChunkingStrategy.md)[]

Defined in: [rag/src/chunking/registry.ts:108](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/chunking/registry.ts#L108)

Get all registered chunkers.

#### Returns

[`ChunkingStrategy`](../interfaces/ChunkingStrategy.md)[]

Array of chunkers

***

### clear()

> **clear**(): `void`

Defined in: [rag/src/chunking/registry.ts:115](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/chunking/registry.ts#L115)

Clear all registered chunkers.

#### Returns

`void`
