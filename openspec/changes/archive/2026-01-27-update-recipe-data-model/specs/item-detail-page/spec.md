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
