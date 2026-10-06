@api
Feature: Books API - listing, filtering, sorting and pagination

  Scenario: Listing books returns the first page with default pagination
    When I send a GET request to "/api/books"
    Then the response status should be 200
    And the response content type should be JSON
    And the response should contain a "data" array
    And the pagination meta should be page 1 and limit 10
    And the "data" array should contain 10 items
    And each item in "data" should have the keys "id, title, author, authorId, genre, year, rating, price"

  Scenario Outline: Filtering books by genre
    When I send a GET request to "/api/books?genre=<genre>"
    Then the response status should be 200
    And every item in "data" should have "genre" equal to "<genre>"

    Examples:
      | genre           |
      | Fantasy         |
      | Science Fiction |
      | Mystery         |
      | Non-Fiction     |

  Scenario: Genre filter is case-insensitive
    When I send a GET request to "/api/books?genre=fantasy"
    Then the response status should be 200
    And every item in "data" should have "genre" equal to "Fantasy"

  Scenario: Filtering by minimum rating
    When I send a GET request to "/api/books?minRating=4.5"
    Then the response status should be 200
    And every item in "data" should have "rating" of at least 4.5

  Scenario Outline: Searching by title or author
    When I send a GET request to "/api/books?q=<term>"
    Then the response status should be 200
    And every item in "data" should mention "<term>" in its title or author

    Examples:
      | term   |
      | marsh  |
      | static |
      | THE    |

  Scenario: Search with no matches returns an empty list, not an error
    When I send a GET request to "/api/books?q=zzzzzz"
    Then the response status should be 200
    And the "data" array should contain 0 items

  Scenario Outline: Sorting books
    When I send a GET request to "/api/books?sort=<field>&order=<order>&limit=50"
    Then the response status should be 200
    And the items in "data" should be sorted by "<field>" in <order> order

    Examples:
      | field  | order |
      | rating | asc   |
      | rating | desc  |
      | price  | asc   |
      | year   | desc  |
      | title  | asc   |

  Scenario: Combining filter, sort and pagination
    When I send a GET request to "/api/books?genre=Science Fiction&sort=year&order=desc&page=1&limit=2"
    Then the response status should be 200
    And the "data" array should contain 2 items
    And every item in "data" should have "genre" equal to "Science Fiction"
    And the items in "data" should be sorted by "year" in desc order
    And the pagination meta should be page 1 and limit 2

  Scenario: Page beyond the last page returns an empty page
    When I send a GET request to "/api/books?page=99"
    Then the response status should be 200
    And the "data" array should contain 0 items

  Scenario Outline: Invalid query parameters are rejected with 400
    When I send a GET request to "/api/books?<query>"
    Then the response status should be 400
    And the response should be an error with code "<code>"
    And the error message should mention "<mention>"

    Examples:
      | query                    | code                  | mention          |
      | page=0                   | INVALID_PARAMETER     | page             |
      | page=-1                  | INVALID_PARAMETER     | page             |
      | page=abc                 | INVALID_PARAMETER     | integer          |
      | limit=0                  | INVALID_PARAMETER     | limit            |
      | limit=51                 | INVALID_PARAMETER     | between          |
      | limit=1.5                | INVALID_PARAMETER     | integer          |
      | minRating=6              | INVALID_PARAMETER     | minRating        |
      | minRating=high           | INVALID_PARAMETER     | number           |
      | minRating=4&maxRating=2  | INVALID_PARAMETER     | maxRating        |
      | sort=colour              | INVALID_PARAMETER     | one of           |
      | order=sideways           | INVALID_PARAMETER     | one of           |
      | page=1&page=2            | INVALID_PARAMETER     | once             |
      | publisher=acme           | UNSUPPORTED_PARAMETER | publisher        |
