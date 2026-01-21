[**ContextAI SDK**](../../../README.md)

***

[ContextAI SDK](../../../README.md) / [react/src](../README.md) / ReasoningStep

# Interface: ReasoningStep

Defined in: [react/src/hooks/types.ts:35](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/react/src/hooks/types.ts#L35)

A step in the ReAct reasoning chain

Used by useAgentStream to expose the agent's thought process:
- thought: The agent's internal reasoning
- action: Decision to use a tool
- observation: Result from tool execution

## Example

```tsx
const { reasoning } = useAgentStream(agent);

reasoning.map(step => {
  if (step.type === 'thought') {
    return <div className="thought">{step.content}</div>;
  }
  if (step.type === 'action') {
    return <div className="action">Using {step.tool}</div>;
  }
  if (step.type === 'observation') {
    return <div className="result">{step.content}</div>;
  }
});
```

## Properties

### type

> **type**: `"thought"` \| `"action"` \| `"observation"`

Defined in: [react/src/hooks/types.ts:37](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/react/src/hooks/types.ts#L37)

Type of reasoning step

***

### content

> **content**: `string`

Defined in: [react/src/hooks/types.ts:39](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/react/src/hooks/types.ts#L39)

Human-readable content describing this step

***

### tool?

> `optional` **tool**: `string`

Defined in: [react/src/hooks/types.ts:41](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/react/src/hooks/types.ts#L41)

Tool name (for action/observation steps)

***

### input?

> `optional` **input**: `Record`\<`string`, `unknown`\>

Defined in: [react/src/hooks/types.ts:43](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/react/src/hooks/types.ts#L43)

Tool input arguments (for action steps)

***

### result?

> `optional` **result**: `unknown`

Defined in: [react/src/hooks/types.ts:45](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/react/src/hooks/types.ts#L45)

Tool execution result (for observation steps)

***

### success?

> `optional` **success**: `boolean`

Defined in: [react/src/hooks/types.ts:47](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/react/src/hooks/types.ts#L47)

Whether tool execution succeeded (for observation steps)

***

### timestamp

> **timestamp**: `number`

Defined in: [react/src/hooks/types.ts:49](https://github.com/draco28/ContextAI/blob/b98634d17a1fafdf14a9ec9c898e37dedbdf7f56/packages/react/src/hooks/types.ts#L49)

Timestamp when this step occurred
