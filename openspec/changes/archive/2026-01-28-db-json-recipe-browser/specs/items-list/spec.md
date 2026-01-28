## ADDED Requirements

### Requirement: Dedicated items list route

The system SHALL provide a dedicated route (`/items`) for browsing items derived from the enriched `db.json` dataset.

#### Scenario: Navigate to items list

- **GIVEN** the user navigates to `/items`
- **WHEN** the page loads
- **THEN** the system displays a list/grid of items

### Requirement: Items list uses slug for navigation

The system SHALL link item cards to item detail pages using the item's `slug`.

#### Scenario: Click item navigates to `/items/[slug]`

- **GIVEN** an item card for "Steel" with `slug: "Steel"`
- **WHEN** the user clicks the item card
- **THEN** the browser navigates to `/items/Steel`
