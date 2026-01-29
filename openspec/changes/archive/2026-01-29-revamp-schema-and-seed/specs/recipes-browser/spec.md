## MODIFIED Requirements

### Requirement: Recipe cards link to item detail by `itemId`

The system SHALL link recipe cards to item detail pages using the output item’s `slug`.

#### Scenario: Recipe card click navigates by slug

- **GIVEN** a recipe card representing an output item with `slug: "Industrial_Explosive"` and name "Industrial Explosive"
- **WHEN** the user clicks the recipe card
- **THEN** the user is navigated to `/items/Industrial_Explosive`

### Requirement: Filter by category and machine

The system SHALL provide filters to select recipes by output item category (`items.category` relationship to `item-categories`) and by `machineName`.

#### Scenario: Filter by category

- **GIVEN** the recipe browser is displayed
- **WHEN** the user selects an item category value (e.g., "AIC Products")
- **THEN** only recipes whose primary output item links to an item category with `name: "AIC Products"` are shown

#### Scenario: Filter by machine

- **GIVEN** the recipe browser is displayed
- **WHEN** the user selects machine "Refining Unit"
- **THEN** only recipes with `machineName: "Refining Unit"` are shown

### Requirement: Sort and order results

The system SHALL allow users to sort results by at least: default, name, craft time, type, and category, with ascending/descending order.

#### Scenario: Sort by craft time ascending

- **GIVEN** the recipe browser is displayed
- **WHEN** the user selects sort by "Craft Time" and order "ASC"
- **THEN** recipes are ordered by increasing machine `craftTime`

#### Scenario: Sort by name descending

- **GIVEN** the recipe browser is displayed
- **WHEN** the user selects sort by "Name" and order "DESC"
- **THEN** recipes are ordered by decreasing output item name (lexicographic)

### Requirement: Handle missing images gracefully

The system SHALL render placeholders for recipe cards when the output item has no image URL available via its media relationship.

#### Scenario: Recipe card without image

- **GIVEN** a recipe whose output item has no linked media image
- **WHEN** the recipe card is rendered
- **THEN** a placeholder is displayed instead of a broken image
