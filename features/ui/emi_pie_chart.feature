@ui @emi @piechart
Feature: EMI pie chart (Home Loan)

  Background:
    Given I launch the EMI calculator application
    And I navigate to the "Home Loan" tab

  Scenario Outline: EMI matches the calculation and the pie chart shows valid data
    When I enter a home loan of <amount> lakh at <rate> percent for <years> years
    Then the displayed EMI should match the independently calculated EMI
    And the pie chart should be visible
    And both pie chart sections should have values greater than zero

    Examples:
      | amount | rate | years |
      | 25     | 10   | 10    |
      | 50     | 7.5  | 15    |
