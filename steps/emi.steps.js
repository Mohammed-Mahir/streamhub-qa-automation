const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('@playwright/test');
const config = require('../config/env');
const { computeEmi, lakh } = require('../utils/emi');
const EmiCalculatorPage = require('../pages/EmiCalculatorPage');
const HomeLoanPage = require('../pages/HomeLoanPage');
const PersonalLoanPage = require('../pages/PersonalLoanPage');

Given('I launch the EMI calculator application', async function () {
  this.emiApp = new EmiCalculatorPage(this.page, config);
  await this.emiApp.open();
});

Given('I navigate to the {string} tab', async function (tabName) {
  await this.emiApp.openTab(tabName);
  this.loanPage = tabName === 'Home Loan' ? new HomeLoanPage(this.page, config) : new PersonalLoanPage(this.page, config);
});

// ---- Test Case 1: Home loan + pie chart ----------------------------------
When('I enter a home loan of {float} lakh at {float} percent for {int} years', async function (amountLakh, rate, years) {
  this.input = { amount: lakh(amountLakh), rate, years };
  await this.loanPage.enterLoanDetails(this.input);
});

Then('the displayed EMI should match the independently calculated EMI', async function () {
  const expected = computeEmi(this.input.amount, this.input.rate, this.input.years);
  await expect
    .poll(async () => Math.abs((await this.loanPage.displayedEmi()) - expected), {
      timeout: config.timeout,
      message: `EMI never matched expected ${expected.toFixed(2)}`,
    })
    .toBeLessThanOrEqual(config.emiTolerance);
  this.attach(`expected=${expected.toFixed(2)} displayed=${await this.loanPage.displayedEmi()}`);
});

Then('the pie chart should be visible', async function () {
  await expect(this.loanPage.pieChart).toBeVisible();
});

Then('both pie chart sections should have values greater than zero', async function () {
  const points = await this.loanPage.pieValues();
  this.attach(JSON.stringify(points));
  expect(points.length, 'pie should have two sections (principal, interest)').toBe(2);
  for (const p of points) expect(p.y, `section "${p.name}"`).toBeGreaterThan(0);
});

// ---- Test Case 2: Personal loan + bar chart --------------------------------
When('I set the personal loan to {float} lakh at {float} percent for {int} years using the sliders', async function (amountLakh, rate, years) {
  this.input = { amount: lakh(amountLakh), rate, years };
  await this.loanPage.setSliders(this.input);
});

When('I change the EMI schedule start month to {string}', async function (month) {
  await this.loanPage.pickScheduleStartMonth(month);
});

Then('the bar chart should be visible', async function () {
  await expect(this.loanPage.bars.first()).toBeVisible();
});

Then('the chart should contain at least as many bars as loan years', async function () {
  this.barCount = await this.loanPage.barCount();
  this.attach(`bar count = ${this.barCount}`);
  expect(this.barCount).toBeGreaterThanOrEqual(this.input.years);
});

Then('the tooltip of the first bar should show valid positive values', async function () {
  const { text, numbers } = await this.loanPage.firstBarTooltip();
  this.attach(`tooltip: ${text}`);
  expect(numbers.length).toBeGreaterThan(0);
  for (const n of numbers) expect(n).toBeGreaterThan(0);
});
