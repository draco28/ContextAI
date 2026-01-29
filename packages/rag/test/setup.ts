/**
 * Vitest Setup File
 *
 * Loads environment variables from .env.test for integration tests.
 * This file runs before any test files are executed.
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.test file from packages/rag directory
config({ path: resolve(__dirname, '../.env.test') });

// Log which test configuration is active (only in verbose mode)
if (process.env.DEBUG_TESTS) {
  console.log('[Test Setup] Environment loaded:');
  console.log('  LLM_TEST_BASE_URL:', process.env.LLM_TEST_BASE_URL ? '✓ set' : '✗ not set');
  console.log('  LLM_TEST_API_KEY:', process.env.LLM_TEST_API_KEY ? '✓ set' : '✗ not set');
  console.log('  NEO4J_TEST_URL:', process.env.NEO4J_TEST_URL ? '✓ set' : '✗ not set');
}
