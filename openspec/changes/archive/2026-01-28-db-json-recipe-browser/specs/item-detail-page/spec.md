## MODIFIED Requirements

### Requirement: Dedicated item detail route

The system SHALL provide a dedicated route (`/items/[slug]`) for viewing detailed information about an item, where `slug` is the URL-friendly identifier from the enriched `db.json`.

#### Scenario: Navigate to item detail page

- **GIVEN** an item exists with `slug: "Industrial_Explosive"`
- **WHEN** user navigates to `/items/Industrial_Explosive`
- **THEN** the item detail page is displayed showing the item's information

#### Scenario: Invalid slug returns 404

- **GIVEN** no item exists with slug "nonexistent_item"
- **WHEN** user navigates to `/items/nonexistent_item`
- **THEN** a 404 not found page is displayed

### Requirement: Back navigation

The system SHALL provide a way to navigate back to the items list.

#### Scenario: User navigates back to list

- **GIVEN** user is on an item detail page
- **WHEN** user clicks the back button or link
- **THEN** user is navigated to the items list page (`/items`)

### Requirement: Link from items list

The system SHALL update the items list to link to item detail pages using slug.

#### Scenario: Click item in list navigates to detail page

- **GIVEN** user is viewing the items list
- **WHEN** user clicks on an item card
- **THEN** user is navigated to that item's detail page (`/items/[slug]`)
