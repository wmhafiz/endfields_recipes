## MODIFIED Requirements

### Requirement: Production chain uses slug for navigation

The system SHALL use item `slug` for routing when users click on item nodes in the production chain.

#### Scenario: Node click navigates using slug

- **GIVEN** a production chain node represents an item with `slug: "Steel"` and display name "Steel"
- **WHEN** the user clicks that item node
- **THEN** the browser navigates to `/items/Steel`

### Requirement: Production chain identity uses itemId internally

The system SHALL build production chains using `itemId` for internal node identity to avoid collisions when multiple items share the same display name.

#### Scenario: Duplicate item names do not collide

- **GIVEN** recipe data contains two distinct items with different `itemId` values but the same display name
- **WHEN** the production chain is built for one of those items
- **THEN** the chain nodes remain uniquely identified and do not merge or overwrite each other

### Requirement: Click node to navigate

The system SHALL allow users to click on item nodes to navigate to that item's detail page.

#### Scenario: Navigate to item via node click

- **GIVEN** a production chain is displayed
- **WHEN** user clicks on an item node
- **THEN** the browser navigates to that item's detail page (`/items/[slug]`)
