@ui @emi @barchart
Feature: EMI bar chart (Personal Loan)

  Background:
    Given I launch the EMI calculator application
    And I navigate to the "Personal Loan" tab

  Scenario: Bar chart renders for a personal loan and exposes tooltip values
    When I set the personal loan to 10 lakh at 12 percent for 5 years using the sliders
    And I change the EMI schedule start month to "Mar"
    Then the bar chart should be visible
    And the chart should contain at least as many bars as loan years
    And the tooltip of the first bar should show valid positive values
