## ADDED Requirements

### Requirement: Dedicated item detail route

The system SHALL provide a dedicated route (`/items/[id]`) for viewing detailed information about an item.

#### Scenario: Navigate to item detail page

- **GIVEN** an item exists with ID "Industrial_Explosive"
- **WHEN** user navigates to `/items/Industrial_Explosive`
- **THEN** the item detail page is displayed showing the item's information

#### Scenario: Invalid item ID returns 404

- **GIVEN** no item exists with ID "nonexistent_item"
- **WHEN** user navigates to `/items/nonexistent_item`
- **THEN** a 404 not found page is displayed

### Requirement: Item header display

The system SHALL display an item header showing the item's image and name prominently.

#### Scenario: Item header renders correctly

- **GIVEN** user is on an item detail page
- **WHEN** the page loads
- **THEN** the item's image and name are displayed in a prominent header section

### Requirement: Back navigation

The system SHALL provide a way to navigate back to the items list.

#### Scenario: User navigates back to list

- **GIVEN** user is on an item detail page
- **WHEN** user clicks the back button or link
- **THEN** user is navigated to the items list page

### Requirement: Production chain section

The system SHALL include a production chain section showing the visualization for craftable items.

#### Scenario: Craftable item shows production chain

- **GIVEN** an item that has a recipe
- **WHEN** the item detail page loads
- **THEN** a "Production Chain" section is displayed containing the React Flow visualization

#### Scenario: Raw material shows no production chain

- **GIVEN** an item that has no recipe (raw material)
- **WHEN** the item detail page loads
- **THEN** the production chain section indicates the item is a raw material with no crafting recipe

### Requirement: Recipe information display

The system SHALL display the direct recipe information (inputs, facility, output) alongside the production chain.

#### Scenario: Direct recipe shown for craftable item

- **GIVEN** an item that has a recipe
- **WHEN** the item detail page loads
- **THEN** the immediate recipe is displayed showing inputs, facility, and output

### Requirement: Used in recipes display

The system SHALL display which recipes use this item as an input.

#### Scenario: Item used in other recipes

- **GIVEN** an item that is used as input in one or more recipes
- **WHEN** the item detail page loads
- **THEN** a "Used In" section lists all recipes where this item is an input

#### Scenario: Item not used in any recipes

- **GIVEN** an item that is not used as input in any recipe
- **WHEN** the item detail page loads
- **THEN** the "Used In" section indicates this item is not used in any recipes

### Requirement: Link from items list

The system SHALL update the items list to link to item detail pages instead of opening modals.

#### Scenario: Click item in list navigates to detail page

- **GIVEN** user is viewing the items list
- **WHEN** user clicks on an item card
- **THEN** user is navigated to that item's detail page (`/items/[id]`)

## MODIFIED Requirements

### Requirement: Display input quantities in recipe cards

The system SHALL display the quantity required for each input in recipe cards.

#### Scenario: Recipe card shows input quantities

- **GIVEN** a recipe with inputs `[{ item: "Xiranite", quantity: 10 }, { item: "Packed Origocrust", quantity: 10 }]`
- **WHEN** the "Produced By" section is rendered
- **THEN** each input displays its quantity (e.g., "Xiranite ×10", "Packed Origocrust ×10")

#### Scenario: Used In recipe shows quantities

- **GIVEN** an item used in a recipe with quantity 5
- **WHEN** the "Used In" section is rendered
- **THEN** the input quantity is displayed for that item

### Requirement: Display output quantity when greater than 1

The system SHALL display the output quantity when a recipe produces more than 1 of an item.

#### Scenario: Recipe with output quantity > 1

- **GIVEN** a recipe with `output: "Jincao"` and `outputQuantity: 2`
- **WHEN** the recipe card is rendered
- **THEN** the output displays "Jincao ×2"

#### Scenario: Recipe with default output quantity

- **GIVEN** a recipe with no `outputQuantity` field (defaults to 1)
- **WHEN** the recipe card is rendered
- **THEN** no quantity badge is shown on the output (or "×1" is omitted)

### Requirement: Display recipe notes subtly

The system SHALL display recipe notes as subtle inline text when present.

#### Scenario: Recipe with notes

- **GIVEN** a recipe with `notes: "Requires Fluid Mode"`
- **WHEN** the recipe card is rendered
- **THEN** the note is displayed as muted/small text below the recipe (not as a prominent alert)

#### Scenario: Recipe without notes

- **GIVEN** a recipe with no `notes` field
- **WHEN** the recipe card is rendered
- **THEN** no notes section is displayed

### Requirement: Source processing time from facility

The system SHALL display processing time by looking up the facility's `processingTime` property.

#### Scenario: Recipe facility has processing time

- **GIVEN** a recipe using "Packaging Unit" and that facility has `processingTime: 10`
- **WHEN** the recipe card is rendered
- **THEN** the facility section displays "⏱ 10s"

#### Scenario: Recipe facility has no processing time

- **GIVEN** a recipe using a facility with no `processingTime`
- **WHEN** the recipe card is rendered
- **THEN** no processing time is displayed

### Requirement: Handle missing images in recipe cards

The system SHALL render placeholders for items/facilities without images.

#### Scenario: Input item without image

- **GIVEN** a recipe input item with no `localImagePath`
- **WHEN** the recipe card is rendered
- **THEN** a placeholder box with the item name is shown instead of a broken image

#### Scenario: Facility without image

- **GIVEN** a recipe facility with no `localImagePath`
- **WHEN** the recipe card is rendered
- **THEN** a placeholder box with the facility name is shown
