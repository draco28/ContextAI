/**
 * Confidence Score Calculation
 *
 * Computes confidence scores for retrieval results based on how well
 * multiple ranking signals agree on a result's relevance.
 *
 * The confidence calculation uses three factors:
 * 1. **Rank Agreement (40%)**: Higher when result ranks similarly across methods
 * 2. **Score Consistency (30%)**: Higher when scores have low variance
 * 3. **Multi-Signal Presence (30%)**: Higher when result appears in all ranker lists
 *
 * @example
 * ```typescript
 * import { calculateConfidence } from './confidence.js';
 *
 * // After RRF fusion
 * const rrfResult = {
 *   id: 'doc-1',
 *   score: 0.85,
 *   chunk: {...},
 *   contributions: [
 *     { name: 'dense', rank: 2, score: 0.92, contribution: 0.016 },
 *     { name: 'sparse', rank: 3, score: 0.88, contribution: 0.015 },
 *   ]
 * };
 *
 * const confidence = calculateConfidence(rrfResult, 2, 100);
 * // Returns: { overall: 0.87, signals: {...}, factors: {...} }
 * ```
 */

import type { ConfidenceScore, RRFResult } from './types.js';

// ============================================================================
// Configuration
// ============================================================================

/**
 * Default weights for confidence calculation.
 * Sum should equal 1.0.
 */
export const CONFIDENCE_WEIGHTS = {
  rankAgreement: 0.4,
  scoreConsistency: 0.3,
  multiSignalPresence: 0.3,
} as const;

/**
 * Ranker name to signal field mapping.
 * Used to populate the signals object in ConfidenceScore.
 */
const RANKER_TO_SIGNAL: Record<string, keyof ConfidenceScore['signals']> = {
  dense: 'vectorSimilarity',
  sparse: 'keywordMatch',
  graph: 'graphContext',
};

// ============================================================================
// Core Calculation Functions
// ============================================================================

/**
 * Calculate rank agreement factor.
 *
 * Measures how well rankers agree on this result's position.
 * Higher scores when result is ranked highly AND consistently across methods.
 *
 * Formula:
 * - Normalize each rank to 0-1 (rank 1 = 1.0, rank N approaches 0)
 * - Average the normalized ranks
 * - Penalize by variance (disagreement reduces score)
 *
 * @param contributions - Per-ranker contribution data from RRF
 * @param totalCandidates - Total number of candidates in retrieval
 * @returns Rank agreement score (0-1)
 */
export const calculateRankAgreement = (
  contributions: RRFResult['contributions'],
  totalCandidates: number
): number => {
  // Filter to contributions that have a rank (present in that ranker's results)
  const rankedContribs = contributions.filter((c) => c.rank !== undefined);

  if (rankedContribs.length === 0) {
    return 0;
  }

  // Use totalCandidates or a reasonable default if very small
  const maxRank = Math.max(totalCandidates, 10);

  // Normalize ranks to 0-1 scale (rank 1 = 1.0, rank maxRank ≈ 0)
  const normalizedRanks = rankedContribs.map(
    (c) => 1 - (c.rank! - 1) / maxRank
  );

  // Calculate average normalized rank
  const avgRank =
    normalizedRanks.reduce((sum, r) => sum + r, 0) / normalizedRanks.length;

  // Calculate variance (measure of disagreement)
  const variance =
    normalizedRanks.reduce((sum, r) => sum + Math.pow(r - avgRank, 2), 0) /
    normalizedRanks.length;

  // Final score: average rank penalized by variance
  // Variance can be at most 0.25 (when values are 0 and 1)
  // We cap variance penalty at 0.5 to not over-penalize
  const variancePenalty = Math.min(Math.sqrt(variance), 0.5);

  return Math.max(0, avgRank * (1 - variancePenalty));
};

/**
 * Calculate score consistency factor.
 *
 * Measures how consistent the scores are across different rankers.
 * Uses coefficient of variation (CV) which is scale-independent.
 *
 * Formula:
 * - CV = standard deviation / mean
 * - Consistency = 1 - min(CV, 1)
 *
 * @param contributions - Per-ranker contribution data from RRF
 * @returns Score consistency (0-1), where 1 = perfectly consistent
 */
export const calculateScoreConsistency = (
  contributions: RRFResult['contributions']
): number => {
  // Filter to contributions that have a score
  const scores = contributions
    .filter((c) => c.score !== undefined && c.score > 0)
    .map((c) => c.score!);

  // Single signal = consistent by definition
  if (scores.length <= 1) {
    return 1;
  }

  // Calculate mean
  const mean = scores.reduce((sum, s) => sum + s, 0) / scores.length;

  // Avoid division by zero
  if (mean === 0) {
    return 0;
  }

  // Calculate standard deviation
  const variance =
    scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);

  // Coefficient of variation
  const cv = stdDev / mean;

  // Return consistency (lower CV = higher consistency)
  return Math.max(0, Math.min(1, 1 - cv));
};

/**
 * Calculate multi-signal presence factor.
 *
 * Measures what fraction of rankers contributed to this result.
 * Higher when result appears in more ranker lists.
 *
 * @param contributions - Per-ranker contribution data from RRF
 * @param numRankers - Total number of rankers in the fusion
 * @returns Multi-signal presence score (0-1)
 */
export const calculateMultiSignalPresence = (
  contributions: RRFResult['contributions'],
  numRankers: number
): { score: number; signalCount: number; allPresent: boolean } => {
  // Count rankers that contributed (have a rank)
  const signalCount = contributions.filter((c) => c.rank !== undefined).length;

  return {
    score: numRankers > 0 ? signalCount / numRankers : 0,
    signalCount,
    allPresent: signalCount === numRankers,
  };
};

/**
 * Extract signal scores from contributions.
 *
 * Maps ranker names to the appropriate signal field in ConfidenceScore.
 *
 * @param contributions - Per-ranker contribution data from RRF
 * @returns Signals object with populated fields
 */
export const extractSignals = (
  contributions: RRFResult['contributions']
): ConfidenceScore['signals'] => {
  const signals: ConfidenceScore['signals'] = {};

  for (const contrib of contributions) {
    const signalField = RANKER_TO_SIGNAL[contrib.name];
    if (signalField && contrib.score !== undefined) {
      signals[signalField] = contrib.score;
    }
  }

  return signals;
};

// ============================================================================
// Main Confidence Calculation
// ============================================================================

/**
 * Calculate confidence score for a retrieval result.
 *
 * Uses the RRF contributions to determine how confident we are that this
 * result is truly relevant. Results that rank highly across multiple
 * retrieval methods with consistent scores get higher confidence.
 *
 * @param rrfResult - The RRF fusion result with contributions
 * @param numRankers - Number of rankers used in fusion (typically 2-3)
 * @param totalCandidates - Total candidates retrieved before fusion (for rank normalization)
 * @returns Complete confidence score breakdown
 *
 * @example
 * ```typescript
 * // Result ranked #1 in both dense and sparse
 * const confidence = calculateConfidence(rrfResult, 2, 50);
 * console.log(confidence.overall); // ~0.95 (high confidence)
 * console.log(confidence.factors.multiSignalPresence); // true
 *
 * // Result only in dense results at rank #20
 * const lowConfidence = calculateConfidence(singleSignalResult, 2, 50);
 * console.log(lowConfidence.overall); // ~0.45 (lower confidence)
 * console.log(lowConfidence.factors.multiSignalPresence); // false
 * ```
 */
export const calculateConfidence = (
  rrfResult: RRFResult,
  numRankers: number,
  totalCandidates: number
): ConfidenceScore => {
  const { contributions } = rrfResult;

  // Calculate individual factors
  const rankAgreement = calculateRankAgreement(contributions, totalCandidates);
  const scoreConsistency = calculateScoreConsistency(contributions);
  const multiSignal = calculateMultiSignalPresence(contributions, numRankers);

  // Calculate weighted overall score
  const overall =
    CONFIDENCE_WEIGHTS.rankAgreement * rankAgreement +
    CONFIDENCE_WEIGHTS.scoreConsistency * scoreConsistency +
    CONFIDENCE_WEIGHTS.multiSignalPresence * multiSignal.score;

  // Extract signal scores
  const signals = extractSignals(contributions);

  return {
    overall: Math.min(1, Math.max(0, overall)), // Clamp to 0-1
    signals,
    factors: {
      rankAgreement,
      scoreConsistency,
      signalCount: multiSignal.signalCount,
      multiSignalPresence: multiSignal.allPresent,
    },
  };
};

/**
 * Calculate confidence scores for multiple RRF results.
 *
 * Convenience function to process an entire result set.
 *
 * @param rrfResults - Array of RRF fusion results
 * @param numRankers - Number of rankers used in fusion
 * @param totalCandidates - Total candidates retrieved before fusion
 * @returns Array of confidence scores (same order as input)
 */
export const calculateConfidenceForResults = (
  rrfResults: RRFResult[],
  numRankers: number,
  totalCandidates: number
): ConfidenceScore[] => {
  return rrfResults.map((result) =>
    calculateConfidence(result, numRankers, totalCandidates)
  );
};
