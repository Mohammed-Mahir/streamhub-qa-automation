const fs = require('fs');
const path = require('path');
const { BeforeAll, AfterAll, Before, After, Status, setDefaultTimeout } = require('@cucumber/cucumber');
const playwright = require('@playwright/test');
const config = require('../config/env');
const { start } = require('../api/server');

setDefaultTimeout(60 * 1000);

let browser;
let mockServer;
const screenshotsDir = path.join(__dirname, '..', 'reports', 'screenshots');

BeforeAll(async function () {
  fs.mkdirSync(screenshotsDir, { recursive: true });
  if (config.startMockApi) {
    const port = Number(new URL(config.apiBaseUrl).port) || 3001;
    mockServer = await start(port);
  }
});

AfterAll(async function () {
  if (browser) await browser.close();
  if (mockServer) await new Promise((r) => mockServer.close(r));
});

// ---- API scenarios --------------------------------------------------------
Before({ tags: '@api' }, async function () {
  this.api = await playwright.request.newContext({ baseURL: config.apiBaseUrl });
});

After({ tags: '@api' }, async function () {
  if (this.api) await this.api.dispose();
});

// ---- UI scenarios (browser launched lazily so API-only runs need no browsers) ----
Before({ tags: '@ui or @selfheal' }, async function () {
  if (!browser) {
    browser = await playwright[config.browser].launch({ headless: config.headless, slowMo: config.slowMo });
  }
  this.context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  this.context.setDefaultTimeout(config.timeout);
  this.page = await this.context.newPage();
});

After({ tags: '@ui or @selfheal' }, async function (scenario) {
  if (this.page) {
    // Always keep a screenshot as execution evidence; name carries pass/fail
    const status = scenario.result.status === Status.PASSED ? 'pass' : 'FAIL';
    const safe = scenario.pickle.name.replace(/[^a-z0-9]+/gi, '_').slice(0, 80);
    const png = await this.page.screenshot({ fullPage: true });
    fs.writeFileSync(path.join(screenshotsDir, `${status}_${safe}.png`), png);
    if (status === 'FAIL') this.attach(png, 'image/png');
  }
  if (this.context) await this.context.close();
});
