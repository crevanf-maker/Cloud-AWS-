const test = require('node:test');
const assert = require('node:assert/strict');
const { computeRiskScore } = require('../src/lib/riskScoring');

test('low severity minor issue during the day scores Low priority', () => {
  const result = computeRiskScore({
    severity: 1,
    category: 'other',
    historicalCount: 0,
    occurredAt: new Date('2024-01-01T14:00:00Z'),
  });
  assert.equal(result.priority, 'Low');
  assert.ok(result.score < 25);
});

test('severe medical incident at night scores Critical priority', () => {
  const result = computeRiskScore({
    severity: 5,
    category: 'medical',
    historicalCount: 3,
    occurredAt: new Date('2024-01-01T02:00:00Z'),
  });
  assert.equal(result.priority, 'Critical');
  assert.ok(result.score >= 75);
});

test('recurring hotspot incidents increase the score', () => {
  const withoutHistory = computeRiskScore({ severity: 3, category: 'security', historicalCount: 0 });
  const withHistory = computeRiskScore({ severity: 3, category: 'security', historicalCount: 10 });
  assert.ok(withHistory.score > withoutHistory.score);
});
