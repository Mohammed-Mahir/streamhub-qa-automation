require('dotenv').config();

const bool = (v, d) => (v === undefined || v === '' ? d : String(v).toLowerCase() === 'true');

module.exports = {
  baseUrl: process.env.BASE_URL || 'https://emicalculator.net',
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3001',
  startMockApi: bool(process.env.START_MOCK_API, true),
  browser: process.env.BROWSER || 'chromium',
  headless: bool(process.env.HEADLESS, true),
  slowMo: Number(process.env.SLOW_MO || 0),
  timeout: Number(process.env.TIMEOUT_MS || 15000),
  // EMI shown on the site is rounded to whole rupees, so allow a small tolerance
  emiTolerance: Number(process.env.EMI_TOLERANCE || 1),
};
