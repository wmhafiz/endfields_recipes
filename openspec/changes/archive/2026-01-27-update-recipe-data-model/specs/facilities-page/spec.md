## ADDED Requirements

### Requirement: Dedicated facilities route

The system SHALL provide a dedicated route (`/facilities`) for browsing facilities.

#### Scenario: Navigate to facilities page

- **GIVEN** user navigates to `/facilities`
- **WHEN** the page loads
- **THEN** a list of all facilities is displayed

### Requirement: Facility card display

The system SHALL display each facility as a card showing its key information.

#### Scenario: Facility card with all fields

- **GIVEN** a facility with `name`, `category`, `description`, `processingTime`, and `localImagePath`
- **WHEN** the facility card is rendered
- **THEN** the card displays the image, name, category badge, description, and processing time (e.g., "⏱ 10s")

#### Scenario: Facility card with missing optional fields

- **GIVEN** a facility with no `processingTime` or `description`
- **WHEN** the facility card is rendered
- **THEN** the card displays image/placeholder, name, and category; no time or description sections appear

#### Scenario: Facility without image

- **GIVEN** a facility with no `localImagePath`
- **WHEN** the facility card is rendered
- **THEN** a placeholder box with the facility name is displayed instead of an image

### Requirement: Facilities grouped or filterable by category

The system SHALL allow users to view facilities by category.

#### Scenario: Filter by category

- **GIVEN** user is viewing the facilities page
- **WHEN** user selects "Processing" from the category filter
- **THEN** only facilities with `category: "Processing"` are displayed

#### Scenario: Show all facilities (default)

- **GIVEN** user is viewing the facilities page with no filter applied
- **WHEN** the page loads
- **THEN** all facilities are displayed

### Requirement: Related recipes section

The system SHALL display recipes associated with each facility.

#### Scenario: Facility with recipes

- **GIVEN** facility "Refining Unit" is used by multiple recipes
- **WHEN** the facility card is rendered
- **THEN** a "Recipes" section lists recipes using this facility, showing:
  - Output item name (with quantity if > 1)
  - Input items with quantities

#### Scenario: Facility with no recipes

- **GIVEN** a facility that is not used by any recipes (e.g., a resourcing facility)
- **WHEN** the facility card is rendered
- **THEN** the "Recipes" section is omitted or shows "No recipes"

### Requirement: Link to item detail from facility page

The system SHALL allow users to navigate to item detail pages from the facility page.

#### Scenario: Click output item in recipe

- **GIVEN** a facility recipe listing shows output "Steel"
- **WHEN** user clicks on "Steel"
- **THEN** user is navigated to `/items/Steel` (the item detail page)

#### Scenario: Click input item in recipe

- **GIVEN** a facility recipe listing shows input "Dense Ferrium Powder"
- **WHEN** user clicks on "Dense Ferrium Powder"
- **THEN** user is navigated to `/items/Dense_Ferrium_Powder` (the item detail page)

### Requirement: Navigation to facilities from main UI

The system SHALL provide a way to navigate to the facilities page.

#### Scenario: Link in header/navigation

- **GIVEN** user is on any page of the app
- **WHEN** user looks at the navigation
- **THEN** a link to "Facilities" is visible and navigates to `/facilities`
