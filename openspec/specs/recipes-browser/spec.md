## ADDED Requirements

### Requirement: Recipe browser page

The system SHALL provide a recipe browser page that lists recipe rows from the normalized `db.json` dataset.

#### Scenario: Recipe browser renders results
- **GIVEN** the user navigates to the recipe browser page
- **WHEN** the page loads
- **THEN** the system displays a list/grid of recipe cards derived from recipe rows

#### Scenario: Recipe cards link to item detail by `itemId`
- **GIVEN** a recipe card representing an output item with `itemId: "item_proc_bomb_1"` and name "Industrial Explosive"
- **WHEN** the user clicks the card
- **THEN** the user is navigated to `/items/item_proc_bomb_1`

### Requirement: Search across recipe fields

The system SHALL allow users to search recipes using a free-text query.

#### Scenario: Search matches output name
- **GIVEN** the recipe browser is displayed
- **WHEN** the user searches for "Aketine"
- **THEN** the results include recipes whose output item name contains "Aketine"

#### Scenario: Search matches description and ingredients
- **GIVEN** the recipe browser is displayed
- **WHEN** the user searches for a term that appears in a recipe description or ingredient item name
- **THEN** matching recipes are included in the results

### Requirement: Filter by recipe type

The system SHALL provide a filter to select recipes by `type` (manual, machine, hub).

#### Scenario: Filter by manual recipes
- **GIVEN** the recipe browser is displayed
- **WHEN** the user selects recipe type "manual"
- **THEN** only recipes with `type: "manual"` are shown

### Requirement: Filter by craft type

The system SHALL provide a filter to select recipes by derived craft type.

#### Scenario: Filter by Processing craft type
- **GIVEN** the recipe browser is displayed
- **WHEN** the user selects craft type "Processing"
- **THEN** only recipes whose machine has craft type "Processing" are shown

### Requirement: Filter by category and machine

The system SHALL provide filters to select recipes by `category` and by `machineName`.

#### Scenario: Filter by category
- **GIVEN** the recipe browser is displayed
- **WHEN** the user selects a category value (e.g., "shaping")
- **THEN** only recipes with `category: "shaping"` are shown

#### Scenario: Filter by machine
- **GIVEN** the recipe browser is displayed
- **WHEN** the user selects machine "Refining Unit"
- **THEN** only recipes with `machineName: "Refining Unit"` are shown

### Requirement: Filter by rarity

The system SHALL provide a filter to select recipes by `rarity`.

#### Scenario: Filter by rarity value
- **GIVEN** the recipe browser is displayed
- **WHEN** the user selects rarity "4"
- **THEN** only recipes with `rarity: "4"` are shown

### Requirement: Filter by uses raw material

The system SHALL provide a filter to select recipes based on whether they use at least one raw material ingredient.

#### Scenario: Filter for recipes that use raw material
- **GIVEN** the recipe browser is displayed
- **WHEN** the user selects "Uses Raw Material: Yes"
- **THEN** only recipes marked as “uses raw material” are shown

#### Scenario: Filter for recipes that do not use raw material
- **GIVEN** the recipe browser is displayed
- **WHEN** the user selects "Uses Raw Material: No"
- **THEN** only recipes not marked as “uses raw material” are shown

### Requirement: Sort and order results

The system SHALL allow users to sort results by at least: default, name, craft time, type, and category, with ascending/descending order.

#### Scenario: Sort by craft time ascending
- **GIVEN** the recipe browser is displayed
- **WHEN** the user selects sort by "Craft Time" and order "ASC"
- **THEN** recipes are ordered by increasing `craftTime`

#### Scenario: Sort by name descending
- **GIVEN** the recipe browser is displayed
- **WHEN** the user selects sort by "Name" and order "DESC"
- **THEN** recipes are ordered by decreasing output item name (lexicographic)

### Requirement: Filters combine with search

The system SHALL apply all active filters and search together.

#### Scenario: Multiple filters combined
- **GIVEN** the user has entered a search query and selected one or more filters
- **WHEN** the results are computed
- **THEN** only recipes matching ALL selected filters AND the search query are shown

### Requirement: Handle missing images gracefully

The system SHALL render placeholders for recipe cards when the output item has no `localImagePath`.

#### Scenario: Recipe card without image
- **GIVEN** a recipe whose output item has no `localImagePath`
- **WHEN** the recipe card is rendered
- **THEN** a placeholder is displayed instead of a broken image

### Requirement: No results state

The system SHALL display an explicit “no results” state when filters/search match nothing.

#### Scenario: No results shown
- **GIVEN** the user has applied filters or a search query that match no recipes
- **WHEN** the results are rendered
- **THEN** the UI displays a no-results message
