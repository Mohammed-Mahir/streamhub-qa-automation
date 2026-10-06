@selfheal
Feature: AI self-healing exercise - intentionally broken locators
  These scenarios are EXPECTED TO FAIL. See docs/AI_SELF_HEALING.md.

  Scenario: Broken locator 1 - wrong id
    When I load the calculator with intentionally broken locators
    Then the broken loan amount locator should find the input

  Scenario: Broken locator 2 - positional CSS
    When I load the calculator with intentionally broken locators
    Then the broken personal loan tab locator should find the tab

  Scenario: Broken locator 3 - brittle absolute XPath
    When I load the calculator with intentionally broken locators
    Then the broken pie slice locator should find the slice

  Scenario: Broken locator 4 - non-existent generated class
    When I load the calculator with intentionally broken locators
    Then the broken EMI result locator should find the result box

  Scenario: Broken locator 5 - stale label text
    When I load the calculator with intentionally broken locators
    Then the broken interest rate locator should find the input
