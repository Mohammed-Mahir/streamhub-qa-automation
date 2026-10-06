const BasePage = require('./BasePage');

class EmiCalculatorPage extends BasePage {
  async open() {
    await this.page.goto(this.config.baseUrl, { waitUntil: 'domcontentloaded' });
    await this.dismissConsentIfPresent();
  }

  async dismissConsentIfPresent() {
    const consent = this.page.getByRole('button', { name: /^(accept|agree|got it|ok)/i });
    if (await consent.first().isVisible().catch(() => false)) await consent.first().click();
  }

  tab(name) {
    // Tabs read e.g. "Home Loan EMI Calculator"; match on the visible text, not position.
    return this.page.getByRole('link', { name: new RegExp(`^${name}`, 'i') }).filter({ visible: true }).first();
  }

  async openTab(name) {
    await this.tab(name).click();
    await this.page.waitForLoadState('domcontentloaded');
  }
}

module.exports = EmiCalculatorPage;
