[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [rag/src](../README.md) / CHARS\_PER\_TOKEN

# Variable: CHARS\_PER\_TOKEN

> `const` **CHARS\_PER\_TOKEN**: `4` = `4`

Defined in: [rag/src/chunking/token-counter.ts:25](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/rag/src/chunking/token-counter.ts#L25)

Average characters per token.

This heuristic is based on GPT tokenizers where:
- Common English words: ~1 token per 4-5 chars
- Whitespace and punctuation: often separate tokens
- Code/special chars: more tokens per char

4 is a conservative estimate that works well for chunking.
