## MODIFIED Requirements

### Requirement: Display input quantities on production chain

The system SHALL display the quantity required for each input in the production chain visualization.

#### Scenario: Input node shows quantity badge

- **GIVEN** a recipe with input `{ item: "Xiranite", quantity: 10 }`
- **WHEN** the production chain is rendered
- **THEN** the edge or input node displays "×10" to indicate the quantity required

### Requirement: Facility processing time sourced from facility data

The system SHALL display processing time on facility nodes using the facility's `processingTime` property (not per-recipe).

#### Scenario: Facility with processing time

- **GIVEN** a facility "Gearing Unit" with `processingTime: 10`
- **WHEN** the facility node is rendered in the production chain
- **THEN** the node displays "⏱ 10s"

#### Scenario: Facility without processing time

- **GIVEN** a facility "Portable Originium Rig" with no `processingTime` property
- **WHEN** the facility node is rendered
- **THEN** no processing time is displayed (no "0s" or placeholder)

### Requirement: Handle missing item images gracefully

The system SHALL render a placeholder when an item has no `localImagePath`.

#### Scenario: Item without image in chain

- **GIVEN** an item "Clean Water" with no `localImagePath`
- **WHEN** the item node is rendered in the production chain
- **THEN** a placeholder box with the item name is displayed instead of a broken image

### Requirement: Handle missing facility images gracefully

The system SHALL render a placeholder when a facility has no `localImagePath`.

#### Scenario: Facility without image in chain

- **GIVEN** a facility with no `localImagePath`
- **WHEN** the facility node is rendered
- **THEN** a placeholder box with the facility name is displayed instead of a broken image
