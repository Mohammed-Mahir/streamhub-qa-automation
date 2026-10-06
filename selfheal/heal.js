#!/usr/bin/env node
/**
 * Self-healing POC (suggest-only). Usage:
 *   node selfheal/heal.js --locator "#home-loan-amount-input" --intent "Home loan amount text box" [--url https://...] [--tag input]
 * Flow: 1) detect failure  2) collect pruned DOM candidates  3) ask Claude for a locator as JSON
 *       4) VALIDATE in the live page (whitelisted methods, exactly 1 match, visible, intent overlap)
 *       5) write a suggestion to reports/selfheal-suggestions.json. It NEVER edits source files.
 * Without ANTHROPIC_API_KEY it runs in dry-run mode and just saves the prompt it would send.
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');
const config = require('../config/env');

const ALLOWED_METHODS = ['getByRole', 'getByLabel', 'getByText', 'getByTestId', 'getByPlaceholder'];
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };

async function collectCandidates(page) {
  return page.evaluate(() => {
    const sel = 'input,button,a,select,textarea,[role],[data-testid]';
    return [...document.querySelectorAll(sel)]
      .filter((el) => el.offsetParent !== null)
      .slice(0, 120)
      .map((el) => ({
        tag: el.tagName.toLowerCase(),
        role: el.getAttribute('role') || undefined,
        id: el.id || undefined,
        name: el.getAttribute('name') || undefined,
        testid: el.getAttribute('data-testid') || undefined,
        label: el.getAttribute('aria-label') || (el.labels && el.labels[0] && el.labels[0].innerText.trim()) || undefined,
        placeholder: el.getAttribute('placeholder') || undefined,
        text: (el.innerText || '').trim().slice(0, 60) || undefined,
      }));
  });
}

function buildPrompt({ failed, intent, error, candidates }) {
  return `A Playwright locator stopped working. Propose ONE replacement.
Failed locator: ${failed}
What it was meant to target: ${intent}
Error: ${error}
Rules: prefer getByRole/getByLabel/getByTestId/getByText; NEVER use nth-child, absolute XPath or generated class names; the locator must match exactly one element.
Allowed methods: ${ALLOWED_METHODS.join(', ')}.
Visible interactive elements (JSON): ${JSON.stringify(candidates)}
Reply with JSON only: {"method": "...", "args": [ ... ], "confidence": 0-1, "reason": "..."}`;
}

async function askClaude(prompt) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: process.env.HEAL_MODEL || 'claude-sonnet-5-5', max_tokens: 500, messages: [{ role: 'user', content: prompt }] }),
  });
  if (!res.ok) throw new Error(`Anthropic API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = data.content.filter((c) => c.type === 'text').map((c) => c.text).join('');
  return JSON.parse(text.replace(/```json|```/g, '').trim());
}

async function validate(page, spec, intent, expectedTag) {
  if (!ALLOWED_METHODS.includes(spec.method)) return { ok: false, why: `method ${spec.method} not allowed` };
  const loc = page[spec.method](...spec.args);
  const count = await loc.count();
  if (count !== 1) return { ok: false, why: `matched ${count} elements (need exactly 1)` };
  if (!(await loc.isVisible())) return { ok: false, why: 'element not visible' };
  const info = await loc.evaluate((el) => ({ tag: el.tagName.toLowerCase(), text: `${el.innerText || ''} ${el.getAttribute('aria-label') || ''} ${el.id} ${el.getAttribute('placeholder') || ''}`.toLowerCase() }));
  if (expectedTag && info.tag !== expectedTag) return { ok: false, why: `expected <${expectedTag}> but got <${info.tag}>` };
  const words = intent.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
  if (words.length && !words.some((w) => info.text.includes(w))) return { ok: false, why: 'element text/label shares no words with the intent' };
  return { ok: true, tag: info.tag };
}

(async () => {
  const failed = arg('locator');
  const intent = arg('intent');
  if (!failed || !intent) { console.error('Need --locator and --intent'); process.exit(2); }
  const browser = await chromium.launch({ headless: config.headless });
  const page = await browser.newPage();
  await page.goto(arg('url', config.baseUrl));

  // 1. Detect
  const broken = await page.locator(failed).count();
  if (broken === 1) { console.log('Locator still works - nothing to heal.'); return browser.close(); }
  const error = `locator resolved to ${broken} elements`;

  // 2-3. Candidates + prompt
  const candidates = await collectCandidates(page);
  const prompt = buildPrompt({ failed, intent, error, candidates });
  fs.mkdirSync('reports', { recursive: true });
  if (!process.env.ANTHROPIC_API_KEY) {
    fs.writeFileSync('reports/selfheal-prompt.txt', prompt);
    console.log('DRY RUN (no ANTHROPIC_API_KEY): prompt saved to reports/selfheal-prompt.txt');
    return browser.close();
  }
  const suggestion = await askClaude(prompt);

  // 4. Validate BEFORE proposing
  const check = await validate(page, suggestion, intent, arg('tag'));
  const record = { failed, intent, suggestion, validation: check, appliedToSource: false, at: new Date().toISOString() };
  const file = path.join('reports', 'selfheal-suggestions.json');
  const all = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : [];
  fs.writeFileSync(file, JSON.stringify([...all, record], null, 2));
  console.log(check.ok ? `VALID suggestion: page.${suggestion.method}(${suggestion.args.map((a) => JSON.stringify(a)).join(', ')})` : `REJECTED: ${check.why}`);
  await browser.close();
})();
