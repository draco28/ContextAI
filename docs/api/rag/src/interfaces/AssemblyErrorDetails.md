[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / AssemblyErrorDetails

# Interface: AssemblyErrorDetails

Defined in: [rag/src/assembly/types.ts:368](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/types.ts#L368)

Details about an assembly error.

## Properties

### code

> **code**: [`AssemblyErrorCode`](../type-aliases/AssemblyErrorCode.md)

Defined in: [rag/src/assembly/types.ts:370](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/types.ts#L370)

Machine-readable error code

***

### assemblerName

> **assemblerName**: `string`

Defined in: [rag/src/assembly/types.ts:372](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/types.ts#L372)

Name of the assembler that failed

***

### cause?

> `optional` **cause**: `Error`

Defined in: [rag/src/assembly/types.ts:374](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/assembly/types.ts#L374)

Underlying cause, if any
