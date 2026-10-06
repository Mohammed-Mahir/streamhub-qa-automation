@api
Feature: Authors API

  Scenario: Listing authors
    When I send a GET request to "/api/authors"
    Then the response status should be 200
    And each item in "data" should have the keys "id, name, country"
    And the pagination meta should be page 1 and limit 10

  Scenario: Filtering authors by country
    When I send a GET request to "/api/authors?country=India"
    Then the response status should be 200
    And every item in "data" should have "country" equal to "India"
    And the "data" array should contain 2 items

  Scenario: Paginating authors
    When I send a GET request to "/api/authors?page=2&limit=2"
    Then the response status should be 200
    And the "data" array should contain 2 items
    And the pagination meta should be page 2 and limit 2

  Scenario: Books for an author
    When I send a GET request to "/api/authors/1/books"
    Then the response status should be 200
    And the "data" array should contain 3 items
    And every item in "data" should have "author" equal to "Elena Marsh"

  Scenario: Books for an author that does not exist
    When I send a GET request to "/api/authors/42/books"
    Then the response status should be 404
    And the response should be an error with code "NOT_FOUND"

  Scenario Outline: Invalid author parameters
    When I send a GET request to "<path>"
    Then the response status should be 400
    And the response should be an error with code "<code>"

    Examples:
      | path                        | code                  |
      | /api/authors?limit=100      | INVALID_PARAMETER     |
      | /api/authors?genre=Fantasy  | UNSUPPORTED_PARAMETER |
      | /api/authors/xyz/books      | INVALID_PARAMETER     |
