import assert from 'node:assert/strict';
import { numberValue } from '../lib/csv.ts';
import { analyzeAgreement } from '../lib/margin.ts';

// Protect import normalization that directly feeds pricing calculations.
assert.equal(numberValue('$1,299.00'), 1299);
assert.equal(numberValue('(25.00)'), -25);
assert.equal(numberValue(' 42.50 '), 42.5);
assert.equal(numberValue('not-a-number', 7), 7);

// Known-value regression: $100 labor + $50 materials + $10 overhead = $160 cost.
// At a 40% target margin, the minimum whole-dollar renewal price is $267.
const result = analyzeAgreement({
  id: 'regression-1',
  customer: 'Regression Customer',
  annualPrice: 240,
  laborHours: 2,
  laborRate: 50,
  materialCost: 50,
  otherCost: 10,
}, 0.4);

assert.equal(result.actualCost, 160);
assert.equal(result.grossProfit, 80);
assert.equal(result.grossMargin, 1 / 3);
assert.equal(result.recommendedPrice, 267);
assert.equal(result.annualUpside, 27);
assert.equal(result.status, 'watch');

console.log('Deterministic import and margin regression checks passed.');
