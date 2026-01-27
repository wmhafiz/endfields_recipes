## ADDED Requirements

### Requirement: Category filter on items list

The system SHALL provide a filter control to show items by category.

#### Scenario: Filter by specific category

- **GIVEN** user is viewing the items list
- **WHEN** user selects "AIC Products" from the category filter
- **THEN** only items with `category: "AIC Products"` are displayed

#### Scenario: Filter by uncategorized

- **GIVEN** user is viewing the items list
- **WHEN** user selects "Uncategorized" from the category filter
- **THEN** only items without a `category` property are displayed

#### Scenario: Show all items (default)

- **GIVEN** user is viewing the items list
- **WHEN** user selects "All" from the category filter (or no filter is applied)
- **THEN** all items are displayed regardless of category

#### Scenario: Category filter combines with search

- **GIVEN** user has entered a search query and selected a category filter
- **WHEN** the items list is filtered
- **THEN** only items matching BOTH the search query AND the selected category are displayed

### Requirement: Category options derived from data

The system SHALL derive available category options from the items data.

#### Scenario: Categories populated from items

- **GIVEN** items with categories "AIC Products" and some items with no category
- **WHEN** the category filter is rendered
- **THEN** options include "All", "AIC Products", and "Uncategorized"

### Requirement: Handle missing item images

The system SHALL render a placeholder for items without `localImagePath`.

#### Scenario: Item card without image

- **GIVEN** an item "Wood" with no `localImagePath`
- **WHEN** the item card is rendered in the grid/list
- **THEN** a placeholder box with the item name is displayed instead of an image
