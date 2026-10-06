# AI self-healing locators

## The intentionally broken locators
All five live in `pages/selfheal/BrokenLocators.js` and are exercised by `features/selfheal/broken_locators.feature`
(`npm run test:selfheal`). They are left broken on purpose; expect 5 failures.

| # | Locator | Why it is brittle / broken | Healed form (target) |
|---|---------|----------------------------|----------------------|
| 1 | `#home-loan-amount-input` | id renamed | `getByRole('textbox', { name: /loan amount/i })` |
| 2 | `div.container > div:nth-child(3) > ul > li:nth-child(2) > a` | positional CSS | `getByRole('link', { name: /^Personal Loan/i })` |
| 3 | `//div[@id="emipaychart-v2"]/div[1]/*[name()="svg"]/...` | absolute XPath into chart SVG | `.highcharts-pie-series .highcharts-point` (first) |
| 4 | `div.css-1x9k2ab.emi-result-box-v3` | generated class names | `getByTestId('emi-result')` / stable id |
| 5 | `getByLabel('Rate of Interest (p.a.)', { exact: true })` | label text reworded | `getByRole('textbox', { name: /interest rate/i })` |

## Approach

**1. Detection.** A custom Playwright/Cucumber `After` hook (or a wrapper around page-object getters) catches
`strict mode violation` / `waiting for locator ... timeout` errors and records: the failing locator string, the
step name, the page URL, and a screenshot. Only locator-resolution failures trigger healing; assertion failures
(wrong value) never do, otherwise healing would hide real bugs.

**2. Context for the model.** Instead of sending the whole page, we send a pruned list of visible interactive
elements (tag, role, id, aria-label, label text, placeholder, data-testid, short text; max ~120) plus the
*intent* of the original locator (e.g. "home loan amount text box"), the error text and a snapshot of the previous
passing run's element if we have one.

**3. Prompt approach.** One constrained prompt (see `buildPrompt` in `selfheal/heal.js`):
- states the intent and the failure,
- lists the candidates,
- sets rules: prefer role/label/testid/text; forbid nth-child, absolute XPath and generated classes; must match
  exactly one element,
- allows only a whitelist of Playwright methods,
- demands JSON only: `{ method, args, confidence, reason }`.

**4. Validation before applying (the important part).** The suggestion is never trusted:
1. Method must be in the whitelist (no `eval`, no arbitrary code from the model).
2. Locator must resolve to **exactly one** element, and it must be visible.
3. Element type must match what the step does (e.g. `<input>` for `fill`).
4. Element text/label must overlap the original intent (guards against healing onto the wrong control).
5. Optional: re-run the failed scenario with the candidate in a throw-away browser context and require the same
   assertions to pass (and the scenario's other steps to still pass).
6. Low confidence or any failed check => reject and report; do not guess.

**5. Applying the fix.** Healing is *suggest-only*: the result is written to `reports/selfheal-suggestions.json`
and surfaced as a PR/diff for a human to review. Auto-applying to the source is deliberately not implemented; a
silent heal can turn a real regression (a control that was genuinely removed) into a green test.

## POC
`selfheal/heal.js` implements steps 1-4 and writes the suggestion (step 5 manual):

```bash
# needs a browser + ANTHROPIC_API_KEY in .env (without a key it runs dry and saves the prompt)
npm run heal -- --locator "#home-loan-amount-input" --intent "Home loan amount text box" --tag input
```

Status: syntax-checked only. It has not been run against the live site or the API from the authoring environment.
