/**
 * Tests for Confidence Score Calculation
 *
 * Verifies that confidence scores correctly reflect:
 * - Rank agreement across multiple rankers
 * - Score consistency (low variance = high confidence)
 * - Multi-signal presence (appearing in all ranker lists)
 */

import { describe, it, expect } from 'vitest';
import {
  calculateConfidence,
  calculateRankAgreement,
  calculateScoreConsistency,
  calculateMultiSignalPresence,
  calculateConfidenceForResults,
  CONFIDENCE_WEIGHTS,
} from '../../src/retrieval/confidence.js';
import type { RRFResult } from '../../src/retrieval/types.js';

// ============================================================================
// Test Fixtures
// ============================================================================

const createMockRRFResult = (
  contributions: RRFResult['contributions']
): RRFResult => ({
  id: 'test-doc',
  score: 0.8,
  chunk: {
    id: 'chunk-1',
    content: 'Test content',
    metadata: {},
  },
  contributions,
});

// ============================================================================
// calculateRankAgreement Tests
// ============================================================================

describe('calculateRankAgreement', () => {
  it('returns high agreement when ranked #1 in all rankers', () => {
    const contributions: RRFResult['contributions'] = [
      { name: 'dense', rank: 1, score: 0.95, contribution: 0.016 },
      { name: 'sparse', rank: 1, score: 0.92, contribution: 0.016 },
    ];

    const agreement = calculateRankAgreement(contributions, 100);

    // Rank 1 normalized = 1.0, no variance
    expect(agreement).toBeGreaterThan(0.95);
  });

  it('returns lower agreement when ranks disagree', () => {
    const contributions: RRFResult['contributions'] = [
      { name: 'dense', rank: 1, score: 0.95, contribution: 0.016 },
      { name: 'sparse', rank: 50, score: 0.3, contribution: 0.009 },
    ];

    const agreement = calculateRankAgreement(contributions, 100);

    // Ranks 1 and 50 have high variance
    expect(agreement).toBeLessThan(0.7);
  });

  it('handles single-signal results', () => {
    const contributions: RRFResult['contributions'] = [
      { name: 'dense', rank: 5, score: 0.7, contribution: 0.015 },
      { name: 'sparse', rank: undefined, score: undefined, contribution: 0 },
    ];

    const agreement = calculateRankAgreement(contributions, 100);

    // Only one rank to consider, no variance
    expect(agreement).toBeGreaterThan(0);
    expect(agreement).toBeLessThan(1);
  });

  it('returns 0 when no rankers contributed', () => {
    const contributions: RRFResult['contributions'] = [
      { name: 'dense', rank: undefined, score: undefined, contribution: 0 },
      { name: 'sparse', rank: undefined, score: undefined, contribution: 0 },
    ];

    const agreement = calculateRankAgreement(contributions, 100);

    expect(agreement).toBe(0);
  });

  it('handles small candidate pools correctly', () => {
    const contributions: RRFResult['contributions'] = [
      { name: 'dense', rank: 3, score: 0.8, contribution: 0.015 },
      { name: 'sparse', rank: 2, score: 0.85, contribution: 0.016 },
    ];

    // Even with small pool, should compute reasonable agreement
    const agreement = calculateRankAgreement(contributions, 5);

    expect(agreement).toBeGreaterThan(0.4);
    expect(agreement).toBeLessThanOrEqual(1);
  });
});

// ============================================================================
// calculateScoreConsistency Tests
// ============================================================================

describe('calculateScoreConsistency', () => {
  it('returns 1.0 for perfectly consistent scores', () => {
    const contributions: RRFResult['contributions'] = [
      { name: 'dense', rank: 1, score: 0.8, contribution: 0.016 },
      { name: 'sparse', rank: 2, score: 0.8, contribution: 0.015 },
      { name: 'graph', rank: 1, score: 0.8, contribution: 0.016 },
    ];

    const consistency = calculateScoreConsistency(contributions);

    // Use toBeCloseTo for floating point comparison
    expect(consistency).toBeCloseTo(1.0, 10);
  });

  it('returns lower consistency for varying scores', () => {
    const contributions: RRFResult['contributions'] = [
      { name: 'dense', rank: 1, score: 0.95, contribution: 0.016 },
      { name: 'sparse', rank: 10, score: 0.3, contribution: 0.014 },
    ];

    const consistency = calculateScoreConsistency(contributions);

    // High variance in scores (0.95 vs 0.3)
    expect(consistency).toBeLessThan(0.7);
    expect(consistency).toBeGreaterThanOrEqual(0);
  });

  it('returns 1.0 for single-signal results', () => {
    const contributions: RRFResult['contributions'] = [
      { name: 'dense', rank: 5, score: 0.75, contribution: 0.015 },
      { name: 'sparse', rank: undefined, score: undefined, contribution: 0 },
    ];

    const consistency = calculateScoreConsistency(contributions);

    // Single signal = consistent by definition
    expect(consistency).toBe(1.0);
  });

  it('handles all-zero scores gracefully', () => {
    const contributions: RRFResult['contributions'] = [
      { name: 'dense', rank: 100, score: 0, contribution: 0.006 },
      { name: 'sparse', rank: 100, score: 0, contribution: 0.006 },
    ];

    const consistency = calculateScoreConsistency(contributions);

    // All-zero scores are filtered out (score > 0 check), treated as single signal
    // This is intentional: zero scores indicate "not really found" even if ranked
    expect(consistency).toBe(1);
    expect(Number.isNaN(consistency)).toBe(false);
  });

  it('handles no scores gracefully', () => {
    const contributions: RRFResult['contributions'] = [
      { name: 'dense', rank: undefined, score: undefined, contribution: 0 },
      { name: 'sparse', rank: undefined, score: undefined, contribution: 0 },
    ];

    const consistency = calculateScoreConsistency(contributions);

    // No scores = single signal behavior
    expect(consistency).toBe(1);
  });
});

// ============================================================================
// calculateMultiSignalPresence Tests
// ============================================================================

describe('calculateMultiSignalPresence', () => {
  it('returns full presence when in all rankers', () => {
    const contributions: RRFResult['contributions'] = [
      { name: 'dense', rank: 1, score: 0.9, contribution: 0.016 },
      { name: 'sparse', rank: 3, score: 0.8, contribution: 0.015 },
    ];

    const presence = calculateMultiSignalPresence(contributions, 2);

    expect(presence.score).toBe(1.0);
    expect(presence.signalCount).toBe(2);
    expect(presence.allPresent).toBe(true);
  });

  it('returns partial presence when in some rankers', () => {
    const contributions: RRFResult['contributions'] = [
      { name: 'dense', rank: 5, score: 0.7, contribution: 0.015 },
      { name: 'sparse', rank: undefined, score: undefined, contribution: 0 },
      { name: 'graph', rank: undefined, score: undefined, contribution: 0 },
    ];

    const presence = calculateMultiSignalPresence(contributions, 3);

    expect(presence.score).toBeCloseTo(1 / 3, 5);
    expect(presence.signalCount).toBe(1);
    expect(presence.allPresent).toBe(false);
  });

  it('returns zero presence when in no rankers', () => {
    const contributions: RRFResult['contributions'] = [
      { name: 'dense', rank: undefined, score: undefined, contribution: 0 },
      { name: 'sparse', rank: undefined, score: undefined, contribution: 0 },
    ];

    const presence = calculateMultiSignalPresence(contributions, 2);

    expect(presence.score).toBe(0);
    expect(presence.signalCount).toBe(0);
    expect(presence.allPresent).toBe(false);
  });

  it('handles 3-way fusion correctly', () => {
    const contributions: RRFResult['contributions'] = [
      { name: 'dense', rank: 2, score: 0.85, contribution: 0.016 },
      { name: 'sparse', rank: 5, score: 0.7, contribution: 0.015 },
      { name: 'graph', rank: 3, score: 0.8, contribution: 0.016 },
    ];

    const presence = calculateMultiSignalPresence(contributions, 3);

    expect(presence.score).toBe(1.0);
    expect(presence.signalCount).toBe(3);
    expect(presence.allPresent).toBe(true);
  });
});

// ============================================================================
// calculateConfidence Integration Tests
// ============================================================================

describe('calculateConfidence', () => {
  it('returns high confidence for #1 in all rankers', () => {
    const rrfResult = createMockRRFResult([
      { name: 'dense', rank: 1, score: 0.95, contribution: 0.016 },
      { name: 'sparse', rank: 1, score: 0.92, contribution: 0.016 },
    ]);

    const confidence = calculateConfidence(rrfResult, 2, 100);

    expect(confidence.overall).toBeGreaterThan(0.9);
    expect(confidence.factors.rankAgreement).toBeGreaterThan(0.95);
    expect(confidence.factors.multiSignalPresence).toBe(true);
    expect(confidence.factors.signalCount).toBe(2);
  });

  it('returns lower confidence when ranks disagree', () => {
    const rrfResult = createMockRRFResult([
      { name: 'dense', rank: 1, score: 0.95, contribution: 0.016 },
      { name: 'sparse', rank: 50, score: 0.3, contribution: 0.009 },
    ]);

    const confidence = calculateConfidence(rrfResult, 2, 100);

    // Still in both lists, but ranks disagree
    expect(confidence.overall).toBeLessThan(0.8);
    expect(confidence.factors.rankAgreement).toBeLessThan(0.7);
    expect(confidence.factors.multiSignalPresence).toBe(true);
  });

  it('returns lower confidence for single-signal results', () => {
    const rrfResult = createMockRRFResult([
      { name: 'dense', rank: 5, score: 0.7, contribution: 0.015 },
      { name: 'sparse', rank: undefined, score: undefined, contribution: 0 },
    ]);

    const confidence = calculateConfidence(rrfResult, 2, 100);

    // Only in dense results - multiSignalPresence is 0.5 (1/2 rankers)
    // Score consistency is 1.0 (single signal)
    // Rank agreement depends on normalized rank
    // Overall should be noticeably lower than a 2-signal result
    expect(confidence.overall).toBeLessThan(0.9);
    expect(confidence.factors.multiSignalPresence).toBe(false);
    expect(confidence.factors.signalCount).toBe(1);
  });

  it('populates signals correctly', () => {
    const rrfResult = createMockRRFResult([
      { name: 'dense', rank: 1, score: 0.95, contribution: 0.016 },
      { name: 'sparse', rank: 2, score: 0.88, contribution: 0.016 },
    ]);

    const confidence = calculateConfidence(rrfResult, 2, 100);

    expect(confidence.signals.vectorSimilarity).toBe(0.95);
    expect(confidence.signals.keywordMatch).toBe(0.88);
    expect(confidence.signals.graphContext).toBeUndefined();
  });

  it('includes graph signal when present', () => {
    const rrfResult = createMockRRFResult([
      { name: 'dense', rank: 1, score: 0.9, contribution: 0.016 },
      { name: 'sparse', rank: 2, score: 0.85, contribution: 0.016 },
      { name: 'graph', rank: 1, score: 0.88, contribution: 0.016 },
    ]);

    const confidence = calculateConfidence(rrfResult, 3, 100);

    expect(confidence.signals.graphContext).toBe(0.88);
    expect(confidence.factors.signalCount).toBe(3);
  });

  it('clamps overall to 0-1 range', () => {
    // Edge case: very high agreement might theoretically exceed 1
    const rrfResult = createMockRRFResult([
      { name: 'dense', rank: 1, score: 1.0, contribution: 0.016 },
      { name: 'sparse', rank: 1, score: 1.0, contribution: 0.016 },
    ]);

    const confidence = calculateConfidence(rrfResult, 2, 100);

    expect(confidence.overall).toBeLessThanOrEqual(1);
    expect(confidence.overall).toBeGreaterThanOrEqual(0);
  });

  it('handles edge case of zero candidates', () => {
    const rrfResult = createMockRRFResult([
      { name: 'dense', rank: 1, score: 0.9, contribution: 0.016 },
      { name: 'sparse', rank: 1, score: 0.85, contribution: 0.016 },
    ]);

    // Zero candidates should not throw
    const confidence = calculateConfidence(rrfResult, 2, 0);

    expect(Number.isNaN(confidence.overall)).toBe(false);
    expect(confidence.overall).toBeGreaterThanOrEqual(0);
  });
});

// ============================================================================
// calculateConfidenceForResults Tests
// ============================================================================

describe('calculateConfidenceForResults', () => {
  it('calculates confidence for multiple results', () => {
    const results: RRFResult[] = [
      createMockRRFResult([
        { name: 'dense', rank: 1, score: 0.95, contribution: 0.016 },
        { name: 'sparse', rank: 1, score: 0.92, contribution: 0.016 },
      ]),
      createMockRRFResult([
        { name: 'dense', rank: 10, score: 0.6, contribution: 0.014 },
        { name: 'sparse', rank: undefined, score: undefined, contribution: 0 },
      ]),
    ];

    const confidences = calculateConfidenceForResults(results, 2, 100);

    expect(confidences).toHaveLength(2);
    expect(confidences[0].overall).toBeGreaterThan(confidences[1].overall);
  });

  it('returns empty array for empty input', () => {
    const confidences = calculateConfidenceForResults([], 2, 100);

    expect(confidences).toHaveLength(0);
  });
});

// ============================================================================
// Weight Validation Tests
// ============================================================================

describe('CONFIDENCE_WEIGHTS', () => {
  it('weights sum to 1.0', () => {
    const sum =
      CONFIDENCE_WEIGHTS.rankAgreement +
      CONFIDENCE_WEIGHTS.scoreConsistency +
      CONFIDENCE_WEIGHTS.multiSignalPresence;

    expect(sum).toBeCloseTo(1.0, 10);
  });
});
