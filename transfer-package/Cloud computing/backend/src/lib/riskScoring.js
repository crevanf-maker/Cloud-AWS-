/**
 * Risk scoring engine for incoming incident reports.
 *
 * The score (0-100) combines:
 *  - Reporter-provided severity (1-5)
 *  - Category weighting (medical / fire / security incidents are riskier)
 *  - Location "hotspot" factor - how many incidents happened at the same
 *    building in the last 30 days (recurring problem areas score higher)
 *  - Time of day - incidents reported at night get a bump because fewer
 *    staff are typically on site to respond quickly
 *
 * This is intentionally simple/explainable (rule-based) so it can be demoed
 * and reasoned about; it can be swapped for a trained model later without
 * changing the rest of the pipeline.
 */

const CATEGORY_WEIGHTS = {
  medical: 25,
  fire: 25,
  security: 20,
  infrastructure: 10,
  harassment: 20,
  other: 5,
};

const SEVERITY_WEIGHT = 15; // multiplied by severity (1-5) -> max 75
const HOTSPOT_WEIGHT = 2; // per prior incident at same location, capped
const HOTSPOT_CAP = 20;
const NIGHT_BONUS = 10;

const PRIORITY_THRESHOLDS = [
  { min: 75, priority: 'Critical' },
  { min: 50, priority: 'High' },
  { min: 25, priority: 'Medium' },
  { min: 0, priority: 'Low' },
];

function isNightTime(date) {
  const hour = date.getUTCHours();
  return hour >= 22 || hour < 6;
}

function priorityForScore(score) {
  return PRIORITY_THRESHOLDS.find((t) => score >= t.min).priority;
}

/**
 * @param {Object} params
 * @param {number} params.severity - 1 (minor) to 5 (life-threatening)
 * @param {string} params.category - incident category key
 * @param {number} params.historicalCount - incidents at same location in last 30 days
 * @param {Date} [params.occurredAt] - defaults to now
 */
function computeRiskScore({ severity, category, historicalCount = 0, occurredAt = new Date() }) {
  const clampedSeverity = Math.min(Math.max(Number(severity) || 1, 1), 5);
  const categoryWeight = CATEGORY_WEIGHTS[String(category).toLowerCase()] ?? CATEGORY_WEIGHTS.other;
  const hotspotScore = Math.min(historicalCount * HOTSPOT_WEIGHT, HOTSPOT_CAP);
  const nightBonus = isNightTime(occurredAt) ? NIGHT_BONUS : 0;

  const rawScore = clampedSeverity * SEVERITY_WEIGHT + categoryWeight + hotspotScore + nightBonus;
  const score = Math.min(Math.round(rawScore), 100);

  return {
    score,
    priority: priorityForScore(score),
    factors: {
      severity: clampedSeverity,
      categoryWeight,
      hotspotScore,
      nightBonus,
    },
  };
}

module.exports = { computeRiskScore, CATEGORY_WEIGHTS, isNightTime };
