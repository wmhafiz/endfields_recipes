## ADDED Requirements

### Requirement: Seed supports reset + rebuild mode

The system SHALL provide a seed workflow option that clears existing seeded data and rebuilds the database from the source datasets.

#### Scenario: Reset deletes existing seeded documents

- **GIVEN** the database contains previously seeded items, machines, recipes, and media
- **WHEN** the seed workflow is executed with reset enabled
- **THEN** existing seeded documents are deleted and then re-created from source data

### Requirement: Seed populates item metadata fields

The seed workflow SHALL populate `items.category` (as a relationship), `items.rarity`, and `items.sortId` (optional) based on the source datasets.

#### Scenario: Item metadata is seeded

- **GIVEN** the seed datasets include category/rarity/sort ordering for an item (category may be missing)
- **WHEN** the seed workflow is executed
- **THEN** the created/updated item document contains the correct `rarity` and, when available, links to the correct item category and stores `sortId`

### Requirement: Seed upserts category collections

The seed workflow SHALL upsert `item-categories` and `machine-categories` documents from the source datasets and SHALL link items and machines to these categories via relationships when category information is available.

#### Scenario: Category documents are created and linked

- **GIVEN** the source dataset includes an item category name and a machine category name
- **WHEN** the seed workflow is executed
- **THEN** corresponding category documents exist and items/machines with those category names link to them

### Requirement: Seed populates machine rarity

The seed workflow SHALL populate `machines.rarity` based on the source dataset when available and SHALL default to 0 when not available.

#### Scenario: Machine rarity defaults when missing

- **GIVEN** a machine exists in the source data with no rarity information
- **WHEN** the seed workflow is executed
- **THEN** the machine document is created/updated with `rarity: 0`

### Requirement: Seed populates machine craft time and validates consistency

The seed workflow SHALL set `machines.craftTime` (milliseconds) based on recipes associated with that machine and SHALL validate that all recipes for a given machine share the same craft time.

#### Scenario: Machine craft time is seeded and validated

- **GIVEN** all recipes for a machine share the same craft time value
- **WHEN** the seed workflow is executed
- **THEN** the machine document stores that craft time and the seed completes successfully

#### Scenario: Inconsistent craft time warns and proceeds deterministically

- **GIVEN** two recipes share the same `machineId` but have different craft time values in the source dataset
- **WHEN** the seed workflow is executed
- **THEN** the seed logs a warning identifying the machine and conflicting craft time values and proceeds by selecting a deterministic craft time

## MODIFIED Requirements

### Requirement: Seed imports item images when available

The system SHALL import item images when a source image path is available and the referenced file exists locally and associate the uploaded media to the corresponding item.

#### Scenario: Item image is imported when source path exists

- **GIVEN** an item’s source image path points to an existing file under `public/`
- **WHEN** the seed workflow is executed
- **THEN** the item is linked to a corresponding `media` document for that image

### Requirement: Seed imports machine images when available

The system SHALL import machine images when a source image path is available and the referenced file exists locally and associate the uploaded media to the corresponding machine.

#### Scenario: Machine image is imported when source path exists

- **GIVEN** a machine image source path exists in the seed inputs and points to an existing file under `public/`
- **WHEN** the seed workflow is executed
- **THEN** the machine is linked to a corresponding `media` document for that image
