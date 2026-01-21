[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / DocumentLoaderRegistry

# Class: DocumentLoaderRegistry

Defined in: [rag/src/loaders/registry.ts:50](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/loaders/registry.ts#L50)

Central registry for document loaders.

Manages loader registration and provides automatic format detection.

## Example

```typescript
const registry = new DocumentLoaderRegistry();

// Register loaders
registry.register(new MarkdownLoader());
registry.register(new PDFLoader());

// Auto-detect and load
const docs = await registry.load('/path/to/file.md', {
  allowedDirectories: ['/path/to']
});

// Or get loader for manual control
const loader = registry.getLoader('file.pdf');
```

## Constructors

### Constructor

> **new DocumentLoaderRegistry**(): `DocumentLoaderRegistry`

#### Returns

`DocumentLoaderRegistry`

## Methods

### register()

> **register**(`loader`, `options?`): `void`

Defined in: [rag/src/loaders/registry.ts:66](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/loaders/registry.ts#L66)

Register a document loader.

The loader's supportedFormats are used to map extensions to the loader.
If multiple loaders support the same format, priority determines which wins.

#### Parameters

##### loader

[`DocumentLoader`](../interfaces/DocumentLoader.md)

The loader to register

##### options?

[`RegisterOptions`](../interfaces/RegisterOptions.md)

Registration options (priority)

#### Returns

`void`

***

### unregister()

> **unregister**(`loaderName`): `boolean`

Defined in: [rag/src/loaders/registry.ts:92](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/loaders/registry.ts#L92)

Unregister a loader by name.

Removes the loader from both format mappings and general list.

#### Parameters

##### loaderName

`string`

Name of the loader to remove

#### Returns

`boolean`

true if a loader was removed

***

### getLoader()

> **getLoader**(`source`): [`DocumentLoader`](../interfaces/DocumentLoader.md)

Defined in: [rag/src/loaders/registry.ts:128](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/loaders/registry.ts#L128)

Get the highest-priority loader for a source.

First tries extension-based matching, then falls back to canLoad().

#### Parameters

##### source

File path or buffer

`string` | `Buffer`\<`ArrayBufferLike`\>

#### Returns

[`DocumentLoader`](../interfaces/DocumentLoader.md)

The best matching loader, or undefined if none found

***

### getLoaders()

> **getLoaders**(`source`): [`DocumentLoader`](../interfaces/DocumentLoader.md)[]

Defined in: [rag/src/loaders/registry.ts:158](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/loaders/registry.ts#L158)

Get all loaders that can handle a source.

Useful when you want to let users choose between multiple options.

#### Parameters

##### source

File path or buffer

`string` | `Buffer`\<`ArrayBufferLike`\>

#### Returns

[`DocumentLoader`](../interfaces/DocumentLoader.md)[]

Array of matching loaders (sorted by priority)

***

### load()

> **load**(`source`, `options?`): `Promise`\<[`Document`](../interfaces/Document.md)[]\>

Defined in: [rag/src/loaders/registry.ts:196](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/loaders/registry.ts#L196)

Load a document using auto-detected loader.

Convenience method that finds the right loader and loads the document.

#### Parameters

##### source

File path or buffer

`string` | `Buffer`\<`ArrayBufferLike`\>

##### options?

[`LoadOptions`](../interfaces/LoadOptions.md)

Load options

#### Returns

`Promise`\<[`Document`](../interfaces/Document.md)[]\>

Loaded documents

#### Throws

If no loader found for the format

***

### canLoad()

> **canLoad**(`source`): `boolean`

Defined in: [rag/src/loaders/registry.ts:221](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/loaders/registry.ts#L221)

Check if any registered loader can handle the source.

#### Parameters

##### source

File path or buffer

`string` | `Buffer`\<`ArrayBufferLike`\>

#### Returns

`boolean`

true if at least one loader can handle it

***

### getSupportedFormats()

> **getSupportedFormats**(): `string`[]

Defined in: [rag/src/loaders/registry.ts:230](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/loaders/registry.ts#L230)

Get all supported formats across all registered loaders.

#### Returns

`string`[]

Array of unique format extensions

***

### getLoaderNames()

> **getLoaderNames**(): `string`[]

Defined in: [rag/src/loaders/registry.ts:239](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/loaders/registry.ts#L239)

Get all registered loader names.

#### Returns

`string`[]

Array of loader names
