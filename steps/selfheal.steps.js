const { When, Then } = require('@cucumber/cucumber');
const { expect } = require('@playwright/test');
const config = require('../config/env');
const BrokenLocators = require('../pages/selfheal/BrokenLocators');
const EmiCalculatorPage = require('../pages/EmiCalculatorPage');

// Short timeout: these are meant to fail fast so the report shows the locator errors.
const SHORT = { timeout: 3000 };

When('I load the calculator with intentionally broken locators', async function () {
  await new EmiCalculatorPage(this.page, config).open();
  this.broken = new BrokenLocators(this.page);
});

Then('the broken loan amount locator should find the input', async function () {
  await this.broken.loanAmountInput.fill('2500000', SHORT);
});
Then('the broken personal loan tab locator should find the tab', async function () {
  await this.broken.personalLoanTab.click(SHORT);
});
Then('the broken pie slice locator should find the slice', async function () {
  await expect(this.broken.pieChartSlice).toBeVisible(SHORT);
});
Then('the broken EMI result locator should find the result box', async function () {
  await expect(this.broken.emiResultBox).toBeVisible(SHORT);
});
Then('the broken interest rate locator should find the input', async function () {
  await this.broken.interestRateInput.fill('10', SHORT);
});
