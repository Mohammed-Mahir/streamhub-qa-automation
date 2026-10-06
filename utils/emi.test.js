const test = require('node:test');
const assert = require('node:assert');
const { computeEmi, lakh, parseAmount, extractNumbers } = require('./emi');

test('Scenario A: 25L @10% for 10y', () => {
  assert.strictEqual(Math.round(computeEmi(lakh(25), 10, 10)), 33038);
});
test('Scenario B: 50L @7.5% for 15y', () => {
  assert.strictEqual(Math.round(computeEmi(lakh(50), 7.5, 15)), 46351);
});
test('Personal: 10L @12% for 5y', () => {
  assert.strictEqual(Math.round(computeEmi(lakh(10), 12, 5)), 22244);
});
test('zero interest', () => assert.strictEqual(computeEmi(1200, 0, 1), 100));
test('parsers', () => {
  assert.strictEqual(parseAmount('₹ 33,038'), 33038);
  assert.deepStrictEqual(extractNumbers('Principal: 1,23,456 Interest: 7,890'), [123456, 7890]);
});
