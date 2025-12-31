import type { z } from 'zod';

interface ZodDefWithType {
  typeName: string;
  type?: z.ZodType;
  innerType?: z.ZodType;
  values?: string[];
  checks?: Array<{ kind: string; value?: unknown }>;
  description?: string;
}

/**
 * Convert Zod schema to JSON Schema for LLM tool definitions
 *
 * This is a minimal implementation that covers common use cases.
 * Extend as needed for more complex schemas.
 */
export function zodToJsonSchema(schema: z.ZodType): Record<string, unknown> {
  const def = schema._def as ZodDefWithType;
  const baseSchema: Record<string, unknown> = {};

  // Add description if present
  if (def.description) {
    baseSchema.description = def.description;
  }

  // Handle ZodObject
  if (def.typeName === 'ZodObject') {
    const shape = (schema as z.ZodObject<z.ZodRawShape>).shape;
    const properties: Record<string, unknown> = {};
    const required: string[] = [];

    for (const [key, value] of Object.entries(shape)) {
      const zodValue = value as z.ZodType;
      properties[key] = zodToJsonSchema(zodValue);

      // Check if optional by looking at the type name
      const valueDef = zodValue._def as ZodDefWithType;
      if (valueDef.typeName !== 'ZodOptional' && valueDef.typeName !== 'ZodDefault') {
        required.push(key);
      }
    }

    return {
      ...baseSchema,
      type: 'object',
      properties,
      required: required.length > 0 ? required : undefined,
      additionalProperties: false,
    };
  }

  // Handle ZodString
  if (def.typeName === 'ZodString') {
    const stringSchema: Record<string, unknown> = { ...baseSchema, type: 'string' };

    // Handle string checks (minLength, maxLength, etc.)
    if (def.checks) {
      for (const check of def.checks) {
        if (check.kind === 'min') stringSchema.minLength = check.value;
        if (check.kind === 'max') stringSchema.maxLength = check.value;
        if (check.kind === 'email') stringSchema.format = 'email';
        if (check.kind === 'url') stringSchema.format = 'uri';
      }
    }

    return stringSchema;
  }

  // Handle ZodNumber
  if (def.typeName === 'ZodNumber') {
    const numberSchema: Record<string, unknown> = { ...baseSchema, type: 'number' };

    if (def.checks) {
      for (const check of def.checks) {
        if (check.kind === 'min') numberSchema.minimum = check.value;
        if (check.kind === 'max') numberSchema.maximum = check.value;
        if (check.kind === 'int') numberSchema.type = 'integer';
      }
    }

    return numberSchema;
  }

  // Handle ZodBoolean
  if (def.typeName === 'ZodBoolean') {
    return { ...baseSchema, type: 'boolean' };
  }

  // Handle ZodArray
  if (def.typeName === 'ZodArray') {
    return {
      ...baseSchema,
      type: 'array',
      items: zodToJsonSchema(def.type!),
    };
  }

  // Handle ZodOptional
  if (def.typeName === 'ZodOptional') {
    return zodToJsonSchema(def.innerType!);
  }

  // Handle ZodDefault
  if (def.typeName === 'ZodDefault') {
    return zodToJsonSchema(def.innerType!);
  }

  // Handle ZodEnum
  if (def.typeName === 'ZodEnum') {
    return {
      ...baseSchema,
      type: 'string',
      enum: def.values,
    };
  }

  // Handle ZodLiteral
  if (def.typeName === 'ZodLiteral') {
    const literalDef = def as ZodDefWithType & { value: unknown };
    return {
      ...baseSchema,
      const: literalDef.value,
    };
  }

  // Handle ZodUnion
  if (def.typeName === 'ZodUnion') {
    const unionDef = def as ZodDefWithType & { options: z.ZodType[] };
    return {
      ...baseSchema,
      oneOf: unionDef.options.map((opt) => zodToJsonSchema(opt)),
    };
  }

  // Handle ZodNullable
  if (def.typeName === 'ZodNullable') {
    const innerSchema = zodToJsonSchema(def.innerType!);
    return {
      ...innerSchema,
      nullable: true,
    };
  }

  // Fallback for unknown types
  return { ...baseSchema, type: 'string' };
}
