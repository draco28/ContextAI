/**
 * Knowledge Graph Extraction Prompts
 *
 * Default prompt templates for LLM-based entity and relation extraction.
 * These prompts are optimized for JSON output with structured schemas.
 */

// ============================================================================
// Entity Extraction Prompt
// ============================================================================

/**
 * Default prompt for entity extraction.
 *
 * Placeholders:
 * - {text}: The input text to analyze
 * - {entityTypes}: Optional list of entity types to focus on
 *
 * The prompt instructs the LLM to return a JSON object with an "entities" array.
 */
export const DEFAULT_ENTITY_EXTRACTION_PROMPT = `Extract all named entities from the following text.

For each entity, provide:
- name: The entity name exactly as it appears in the text
- type: One of: person, organization, location, concept, product, technology, event, date, quantity, other
- description: Brief description of the entity in this context (1 sentence max)
- confidence: Your confidence score from 0.0 to 1.0

Guidelines:
- Extract proper nouns, technical terms, and significant concepts
- Use the most specific type that applies (e.g., "technology" for programming languages)
- Higher confidence (0.8+) for clearly named entities
- Lower confidence (0.5-0.7) for inferred or ambiguous entities
- Do NOT extract common words or generic terms

Text to analyze:
---
{text}
---

Respond with a JSON object containing an "entities" array:
{
  "entities": [
    {
      "name": "OpenAI",
      "type": "organization",
      "description": "AI research company that developed GPT models",
      "confidence": 0.95
    }
  ]
}

Return ONLY valid JSON, no additional text or markdown code blocks.`;

/**
 * Entity extraction prompt with type filtering.
 *
 * Use this when you only want specific entity types.
 */
export const FILTERED_ENTITY_EXTRACTION_PROMPT = `Extract named entities of the following types from the text: {entityTypes}

For each entity, provide:
- name: The entity name exactly as it appears in the text
- type: One of the specified types above
- description: Brief description of the entity in this context (1 sentence max)
- confidence: Your confidence score from 0.0 to 1.0

Text to analyze:
---
{text}
---

Respond with a JSON object containing an "entities" array:
{
  "entities": [
    {
      "name": "Example Entity",
      "type": "person",
      "description": "Description of this entity",
      "confidence": 0.9
    }
  ]
}

Return ONLY valid JSON, no additional text or markdown code blocks.`;

// ============================================================================
// Relation Extraction Prompt
// ============================================================================

/**
 * Default prompt for relation extraction.
 *
 * Placeholders:
 * - {text}: The input text to analyze
 * - {entityList}: Comma-separated list of entity names to find relations between
 *
 * The prompt instructs the LLM to return a JSON object with a "relations" array.
 */
export const DEFAULT_RELATION_EXTRACTION_PROMPT = `Extract relationships between the following entities from the text.

Known entities: {entityList}

For each relationship, provide:
- sourceName: Name of the source entity (must be from the list above)
- targetName: Name of the target entity (must be from the list above)
- relationType: One of: references, contains, relatedTo, derivedFrom, mentions, similarTo
- description: Natural language description of the relationship (1 sentence)
- confidence: Your confidence score from 0.0 to 1.0
- bidirectional: true if the relationship applies in both directions

Guidelines:
- Only extract relationships explicitly stated or strongly implied in the text
- Source → Target indicates directionality (e.g., "A contains B" means source=A, target=B)
- Mark as bidirectional only for symmetric relationships (e.g., "A and B are similar")
- Higher confidence (0.8+) for explicit relationships
- Lower confidence (0.5-0.7) for implied relationships

Text to analyze:
---
{text}
---

Respond with a JSON object containing a "relations" array:
{
  "relations": [
    {
      "sourceName": "OpenAI",
      "targetName": "GPT-4",
      "relationType": "contains",
      "description": "OpenAI developed and operates GPT-4",
      "confidence": 0.9,
      "bidirectional": false
    }
  ]
}

Return ONLY valid JSON, no additional text or markdown code blocks.`;

// ============================================================================
// Combined Extraction Prompt
// ============================================================================

/**
 * Default prompt for combined entity and relation extraction.
 *
 * Placeholders:
 * - {text}: The input text to analyze
 *
 * More efficient than separate calls when you need both.
 */
export const DEFAULT_COMBINED_EXTRACTION_PROMPT = `Extract all named entities and their relationships from the following text.

## Entity Extraction
For each entity, provide:
- name: The entity name exactly as it appears in the text
- type: One of: person, organization, location, concept, product, technology, event, date, quantity, other
- description: Brief description (1 sentence max)
- confidence: Score from 0.0 to 1.0

## Relationship Extraction
For each relationship, provide:
- sourceName: Source entity name (must match an entity you extracted)
- targetName: Target entity name (must match an entity you extracted)
- relationType: One of: references, contains, relatedTo, derivedFrom, mentions, similarTo
- description: Relationship description (1 sentence)
- confidence: Score from 0.0 to 1.0
- bidirectional: true if relationship applies both ways

Guidelines:
- Extract entities first, then relationships between them
- Only include relationships where BOTH entities were extracted
- Use the entity names exactly as you extracted them

Text to analyze:
---
{text}
---

Respond with a JSON object containing both "entities" and "relations" arrays:
{
  "entities": [
    {
      "name": "Sam Altman",
      "type": "person",
      "description": "CEO of OpenAI",
      "confidence": 0.95
    },
    {
      "name": "OpenAI",
      "type": "organization",
      "description": "AI research company",
      "confidence": 0.95
    }
  ],
  "relations": [
    {
      "sourceName": "Sam Altman",
      "targetName": "OpenAI",
      "relationType": "relatedTo",
      "description": "Sam Altman is the CEO of OpenAI",
      "confidence": 0.9,
      "bidirectional": false
    }
  ]
}

Return ONLY valid JSON, no additional text or markdown code blocks.`;

// ============================================================================
// Prompt Utilities
// ============================================================================

/**
 * Replace placeholders in a prompt template.
 *
 * @param template - Prompt template with {placeholder} syntax
 * @param values - Object with placeholder values
 * @returns Prompt with placeholders replaced
 */
export function formatPrompt(
  template: string,
  values: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(values)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }
  return result;
}
