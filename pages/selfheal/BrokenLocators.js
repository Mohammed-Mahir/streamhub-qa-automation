/**
 * AI SELF-HEALING EXERCISE - these locators are INTENTIONALLY BROKEN. Do not "fix" them:
 * docs/AI_SELF_HEALING.md explains how they would be detected and healed with AI.
 * Run them with: npm run test:selfheal  (expected: all scenarios fail with locator errors)
 */
class BrokenLocators {
  constructor(page) {
    this.page = page;
  }

  // 1. Wrong id - the real control is the "Loan Amount" textbox (id was renamed in this "release")
  get loanAmountInput() {
    return this.page.locator('#home-loan-amount-input');
  }

  // 2. Positional CSS - breaks as soon as a parent wrapper or tab order changes
  get personalLoanTab() {
    return this.page.locator('div.container > div:nth-child(3) > ul > li:nth-child(2) > a');
  }

  // 3. Brittle absolute XPath into the chart's SVG internals
  get pieChartSlice() {
    return this.page.locator('//div[@id="emipaychart-v2"]/div[1]/*[name()="svg"]/*[name()="g"][4]/*[name()="path"][1]');
  }

  // 4. Non-existent CSS class (a generated class name that changed)
  get emiResultBox() {
    return this.page.locator('div.css-1x9k2ab.emi-result-box-v3');
  }

  // 5. Stale text - the label was reworded from "Interest Rate" to something else
  get interestRateInput() {
    return this.page.getByLabel('Rate of Interest (p.a.)', { exact: true });
  }
}

module.exports = BrokenLocators;
