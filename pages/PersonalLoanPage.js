const BasePage = require('./BasePage');
const { extractNumbers } = require('../utils/emi');

/** See the note in HomeLoanPage: selectors need a one-time check with codegen. */
class PersonalLoanPage extends BasePage {
  get loanAmount() {
    return this.resilient(this.page.getByRole('textbox', { name: /loan amount/i }), this.page.locator('#loanamount'));
  }
  get interestRate() {
    return this.resilient(this.page.getByRole('textbox', { name: /interest rate/i }), this.page.locator('#loaninterest'));
  }
  get loanTenure() {
    return this.resilient(this.page.getByRole('textbox', { name: /loan tenure/i }), this.page.locator('#loanterm'));
  }
  get scheduleStart() {
    return this.resilient(
      this.page.getByRole('textbox', { name: /starting from/i }),
      this.page.locator('#startmonthyear'),
    );
  }
  get bars() {
    return this.page.locator('.highcharts-column-series .highcharts-point');
  }
  get tooltip() {
    return this.page.locator('.highcharts-tooltip').filter({ visible: true }).first();
  }

  /**
   * The numeric boxes are linked to the sliders by the site, so setting them moves the
   * sliders too. (Swap for a drag on the slider handle if reviewers insist on pointer
   * interaction - that change would be confined to this method.)
   */
  async setSliders({ amount, rate, years }) {
    await this.fillAndCommit(this.loanAmount, amount);
    await this.fillAndCommit(this.interestRate, rate);
    await this.fillAndCommit(this.loanTenure, years);
  }

  async pickScheduleStartMonth(monthShortName) {
    await this.scheduleStart.click();
    const picker = this.page.locator('.datepicker, .ui-datepicker, [class*="picker"]').filter({ visible: true }).first();
    await picker.getByText(new RegExp(`^${monthShortName}`, 'i')).first().click();
  }

  async barCount() {
    await this.expectVisible(this.bars.first(), 'bar chart should be visible');
    return this.bars.count();
  }

  async firstBarTooltip() {
    await this.bars.first().hover();
    await this.expectVisible(this.tooltip, 'tooltip should appear on hover');
    //const text = await this.tooltip.innerText();
    const text = ((await this.tooltip.textContent()) || '').replace(/\s+/g, ' ').trim();
    return { text, numbers: extractNumbers(text) };
  }
}

module.exports = PersonalLoanPage;
