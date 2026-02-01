## ADDED Requirements

### Requirement: Production chain excludes manual crafting recipes

The system SHALL exclude recipes with `type: 'manual'` when building production chains.

#### Scenario: Manual recipe not shown in chain

- **GIVEN** an item has both a manual crafting recipe and a machine recipe
- **WHEN** the production chain is built for that item
- **THEN** only the machine recipe appears in the chain

#### Scenario: Item with only manual recipe shows as raw material

- **GIVEN** an item has only a manual crafting recipe (no machine recipe)
- **WHEN** the production chain is built and reaches that item
- **THEN** the item is displayed as a terminal node (like a raw material)

### Requirement: Production chain prefers ore-based paths

The system SHALL prefer recipes that use raw materials (ores) as ingredients over recipes that use intermediate/processed items.

#### Scenario: Prefer ore over powder

- **GIVEN** an item can be produced by Recipe A (uses Iron Ore directly) or Recipe B (uses Iron Powder which requires Iron Ore)
- **WHEN** the production chain is built with no explicit recipe selection
- **THEN** Recipe A (ore-based) is selected as the default

#### Scenario: Score by raw material count

- **GIVEN** Recipe A has 2 raw material ingredients and 1 processed ingredient
- **GIVEN** Recipe B has 0 raw material ingredients and 3 processed ingredients
- **WHEN** the system selects the default recipe
- **THEN** Recipe A is preferred over Recipe B

### Requirement: Manual recipe exclusion applies recursively

The system SHALL exclude manual recipes at all levels of the production chain, not just the root item.

#### Scenario: Nested ingredient excludes manual recipe

- **GIVEN** building a chain for Item X which requires Item Y
- **GIVEN** Item Y has both a manual recipe and a machine recipe
- **WHEN** the production chain traverses to Item Y
- **THEN** only the machine recipe for Item Y is considered

### Requirement: User can still override recipe selection

The system SHALL allow users to manually select alternative recipes via the existing recipe selector, overriding the automatic preference.

#### Scenario: Override ore preference with manual selection

- **GIVEN** the production chain shows a recipe using ore
- **GIVEN** an alternative recipe exists using processed materials
- **WHEN** the user selects the alternative recipe via the recipe selector
- **THEN** the chain updates to use the user-selected recipe
