@api
Feature: Books API - single book lookup

  Scenario: Fetching an existing book
    When I send a GET request to "/api/books/1"
    Then the response status should be 200
    And the "data" object should have the keys "id, title, author, authorId, genre, year, rating, price"

  Scenario: Fetching a book that does not exist
    When I send a GET request to "/api/books/9999"
    Then the response status should be 404
    And the response should be an error with code "NOT_FOUND"

  Scenario Outline: Invalid book ids are rejected
    When I send a GET request to "/api/books/<id>"
    Then the response status should be 400
    And the response should be an error with code "INVALID_PARAMETER"

    Examples:
      | id   |
      | abc  |
      | 0    |
      | -5   |
      | 1.5  |

  Scenario: Query parameters are not supported on the detail endpoint
    When I send a GET request to "/api/books/1?expand=author"
    Then the response status should be 400
    And the response should be an error with code "UNSUPPORTED_PARAMETER"

  Scenario: Unknown routes return a JSON 404
    When I send a GET request to "/api/magazines"
    Then the response status should be 404
    And the response should be an error with code "NOT_FOUND"
