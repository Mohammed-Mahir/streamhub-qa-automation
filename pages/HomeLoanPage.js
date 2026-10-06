const BasePage = require('./BasePage');
const { getHighchartsPoints } = require('./ChartHelper');
const { parseAmount } = require('../utils/emi');

/**
 * NOTE: selectors for emicalculator.net were written from knowledge of the site and
 * could not be verified from the authoring sandbox (no access to the site). Check them
 * once with `npx playwright codegen https://emicalculator.net` and adjust here ONLY -
 * they are deliberately centralised in this file.
 */
class HomeLoanPage extends BasePage {
  get loanAmount() {
    return this.resilient(this.page.getByRole('textbox', { name: /loan amount/i }), this.page.locator('#loanamount'));
  }
  get interestRate() {
    return this.resilient(this.page.getByRole('textbox', { name: /interest rate/i }), this.page.locator('#loaninterest'));
  }
  get loanTenure() {
    return this.resilient(this.page.getByRole('textbox', { name: /loan tenure/i }), this.page.locator('#loanterm'));
  }
  get emiResult() {
    return this.resilient(this.page.getByTestId('emi-result'), this.page.getByText('Loan EMI₹'));
  }
  get pieChart() {
    return this.page.locator('.highcharts-pie-series').first();
  }
  get pieSlices() {
    return this.page.locator('.highcharts-pie-series .highcharts-point');
  }

  async enterLoanDetails({ amount, rate, years }) {
    await this.fillAndCommit(this.loanAmount, amount);
    await this.fillAndCommit(this.interestRate, rate);
    await this.fillAndCommit(this.loanTenure, years);
  }

  async displayedEmi() {
    await this.expectVisible(this.emiResult, 'EMI result should be visible');
    return parseAmount(await this.emiResult.innerText());
  }

  async pieValues() {
    await this.expectVisible(this.pieChart, 'pie chart should be visible');
    const points = await getHighchartsPoints(this.page, 'pie');
    if (!points) throw new Error('Could not read pie data via Highcharts API');
    return points;
  }
}

module.exports = HomeLoanPage;
