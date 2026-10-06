const { When, Then } = require('@cucumber/cucumber');
const { expect } = require('@playwright/test');

When('I send a GET request to {string}', async function (url) {
  this.response = await this.api.get(url);
  this.body = await this.response.json().catch(() => null);
});

Then('the response status should be {int}', async function (status) {
  expect(this.response.status(), `body: ${JSON.stringify(this.body)}`).toBe(status);
});

Then('the response should contain a {string} array', function (key) {
  expect(Array.isArray(this.body[key])).toBe(true);
});

Then('the {string} array should contain {int} items', function (key, count) {
  expect(this.body[key]).toHaveLength(count);
});

Then('the {string} array should contain at most {int} items', function (key, max) {
  expect(this.body[key].length).toBeLessThanOrEqual(max);
});

Then('the pagination meta should be page {int} and limit {int}', function (page, limit) {
  expect(this.body.meta).toMatchObject({ page, limit });
  expect(this.body.meta.total).toBeGreaterThanOrEqual(this.body.data.length);
  expect(this.body.meta.totalPages).toBeGreaterThanOrEqual(1);
});

Then('every item in {string} should have {string} equal to {string}', function (key, field, value) {
  expect(this.body[key].length).toBeGreaterThan(0);
  for (const item of this.body[key]) expect(String(item[field]).toLowerCase()).toBe(value.toLowerCase());
});

Then('every item in {string} should have {string} of at least {float}', function (key, field, min) {
  expect(this.body[key].length).toBeGreaterThan(0);
  for (const item of this.body[key]) expect(item[field]).toBeGreaterThanOrEqual(min);
});

Then('every item in {string} should mention {string} in its title or author', function (key, term) {
  expect(this.body[key].length).toBeGreaterThan(0);
  for (const item of this.body[key]) {
    const hay = `${item.title} ${item.author}`.toLowerCase();
    expect(hay).toContain(term.toLowerCase());
  }
});

Then('the items in {string} should be sorted by {string} in {word} order', function (key, field, order) {
  const values = this.body[key].map((i) => i[field]);
  const sorted = [...values].sort((a, b) => (typeof a === 'string' ? a.localeCompare(b) : a - b));
  if (order === 'desc') sorted.reverse();
  expect(values).toEqual(sorted);
});

Then('each item in {string} should have the keys {string}', function (key, keys) {
  const expected = keys.split(',').map((k) => k.trim()).sort();
  for (const item of this.body[key]) expect(Object.keys(item).sort()).toEqual(expected);
});

Then('the {string} object should have the keys {string}', function (key, keys) {
  const expected = keys.split(',').map((k) => k.trim()).sort();
  expect(Object.keys(this.body[key]).sort()).toEqual(expected);
});

Then('the response should be an error with code {string}', function (code) {
  expect(this.body).toHaveProperty('error');
  expect(this.body.error.code).toBe(code);
  expect(typeof this.body.error.message).toBe('string');
});

Then('the error message should mention {string}', function (text) {
  expect(this.body.error.message.toLowerCase()).toContain(text.toLowerCase());
});

Then('the response content type should be JSON', function () {
  expect(this.response.headers()['content-type']).toContain('application/json');
});
