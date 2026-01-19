/**
 * Built-in Tools
 *
 * Ready-to-use tools for common agent tasks.
 *
 * @module tools
 */

// retrieve_knowledge - RAG integration tool
export {
  createRetrieveKnowledgeTool,
  retrieveKnowledgeInputSchema,
  type RAGEngineInterface,
  type RetrieveKnowledgeToolOptions,
  type RetrieveKnowledgeInput,
  type RetrieveKnowledgeOutput,
} from './retrieve-knowledge.js';
