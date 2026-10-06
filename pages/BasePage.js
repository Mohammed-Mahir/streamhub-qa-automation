const { expect } = require('@playwright/test');

class BasePage {
  constructor(page, config) {
    this.page = page;
    this.config = config;
  }

  /**
   * Resilient locator: prefer role/label (accessible) first, fall back to a stable id.
   * `.or()` matches either; `.first()` only disambiguates when both point at the same control.
   */
  resilient(primary, fallback) {
    return primary.or(fallback).first();
  }

  async fillAndCommit(locator, value) {
    await locator.click();
    await locator.fill(String(value));
    await locator.press('Tab'); // blur => the site recalculates
  }

  async expectVisible(locator, description) {
    await expect(locator, description).toBeVisible({ timeout: this.config.timeout });
  }
}

module.exports = BasePage;
