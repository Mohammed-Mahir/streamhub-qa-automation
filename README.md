# Streamhub QA Automation Assessment (Section B)

Playwright + Cucumber (JavaScript) framework covering: a mock REST API with Playwright API tests (B1/B2),
EMI calculator UI tests (B3), SQL scenarios (B4), and an AI self-healing exercise.

## Setup
```bash
npm install
npx playwright install chromium
cp .env.example .env          # all URLs/config come from here - nothing is hardcoded
```

## Run
| Command | What it does |
|---|---|
| `npm test` | API + UI features (not the self-heal demo) |
| `npm run test:api` | Books/Authors API tests (the mock API is started automatically) |
| `npm run test:ui` | EMI calculator pie chart + bar chart tests (needs a browser + internet) |
| `npm run test:selfheal` | Intentionally broken locators - **expected to fail** |
| `npm run test:unit` | Unit tests for the independent EMI maths |
| `npm run sql` | Builds SQLite DB, runs both SQL scenarios, writes `sql/results/` |
| `npm run api:start` | Start the mock API alone on :3001 |
| `npm run heal -- --locator ... --intent ...` | Self-healing POC |

## Architecture
```
config/env.js          env config (dotenv)            features/   Gherkin (api/, ui/, selfheal/)
steps/                 step definitions               pages/      Page Objects (+ ChartHelper, selfheal/BrokenLocators)
support/               world + hooks (lifecycle,      api/        Express mock API + JSON data
                       screenshots, API context)      utils/emi.js independent EMI calculation
sql/                   schema, seed, queries, runner  docs/       AI_SELF_HEALING.md
reports/               HTML/JSON reports, screenshots, console output
```
- Page objects own all locators; step definitions contain no selectors.
- Locators prefer role/label/test-id; `resilient()` falls back to a stable id. No positional selectors in working code.
- Browsers launch lazily only for `@ui` scenarios, so API runs need no browser.
- Expected EMI is computed in `utils/emi.js` (`P·r·(1+r)^n / ((1+r)^n − 1)`), never read from the app.

## Mock API (B1)
`GET /api/books` (filter `genre`, `minRating`, `maxRating`; search `q`; `sort`=title|year|rating|price; `order`; `page`; `limit`),
`GET /api/books/:id`, `GET /api/authors` (`country`, `q`, pagination), `GET /api/authors/:id/books`.
Invalid input returns `400 {error:{code,message}}` (`INVALID_PARAMETER` / `UNSUPPORTED_PARAMETER`), unknown ids/routes `404`.

## SQL (B4)
`sql/01_schema.sql`, `02_seed.sql`, `scenario1_round_trip.sql`, `scenario2_streaks.sql`; outputs in `sql/results/`.
Assumptions: "within 10%" is measured against the outbound amount; the return must come after the outbound and
within 24h inclusive; "consecutive" means consecutive matches *the player played*.

## Test results
See `reports/`: `cucumber-report.html/json`, `api-test-console-output.txt`, `unit-test-output.txt`, `screenshots/`.

**Status:** API tests (47 scenarios), UI tests (3 scenarios), unit tests and SQL queries were all executed; results are in `reports/`. The self-heal scenarios fail intentionally.

## Known limitations
- emicalculator.net selectors were checked with `npx playwright codegen`; if the site's markup changes, fix them in the page objects only.
- Sliders are driven through their linked numeric inputs rather than by dragging.
- The site may show consent banners/ads; `dismissConsentIfPresent` handles a simple one.

## Claude Code reflection

**How I used it.** I used Claude (through the chat interface, not the Claude Code CLI) as a pair programmer. I gave it the assessment PDF and asked it to scaffold a Playwright + Cucumber framework for Section B: folder structure, page objects, step definitions, env config, a mock API, SQL queries and the self-healing write-up. I then ran everything on my own machine and went back to it with real errors and codegen output.

**What worked.** The scaffold gave me a clean structure quickly (features, steps, page objects, config with no hardcoded URLs). It was also fast at the unfamiliar parts: the SQL gaps-and-islands approach for the IPL streaks, the self-healing prompt/validation design, and explaining Cucumber and Playwright APIs. The API tests passed on the first full run (47 scenarios).

**What did not work, and how I caught it.**
- **Guessed selectors.** The AI could not reach emicalculator.net, so its selectors for the site were guesses. I verified them with `playwright codegen` and replaced the EMI result locator with one that actually exists on the page.
- **Tooltip bug.** The bar chart test failed with "Node is not an HTMLElement" because the Highcharts tooltip is an SVG element and `innerText` does not work on it. Switching to `textContent()` fixed it.
- **Timing bug.** One run showed an EMI of 24,126 instead of 33,038. I recognised that 24,126 is the EMI for the default 20-year tenure, so the test had read the value before the page recalculated. I replaced the one-shot check with a retrying `expect.poll`.
- **Small mistakes in its output.** It wrote a wrong expected count in a feature file (4 books instead of 3 for one author), and it quoted the wrong number of rows for one SQL result. The test run and the actual output exposed both.

**Where I used my own judgement.** I rejected locators like `locator('path').nth(1)` and `locator('rect').nth(2)` from codegen because positional selectors are exactly what the brief says to avoid; I kept class-based and accessible-name locators instead. I also did not make the self-healing POC auto-apply fixes, since silently healing a locator could hide a real regression.