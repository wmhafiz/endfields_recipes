## ADDED Requirements

### Requirement: Seed command imports `db.json` into the database
The system SHALL provide a seed workflow that reads the enriched dataset at `src/data/db.json` and imports it into Payload collections backed by PostgreSQL.

#### Scenario: Seed populates items, machines, and recipes
- **GIVEN** an empty database
- **WHEN** the seed workflow is executed
- **THEN** items, machines, and recipes are created in the database

### Requirement: Seed is idempotent
The system SHALL allow the seed workflow to be executed multiple times without creating duplicate documents.

#### Scenario: Running seed twice does not create duplicates
- **GIVEN** the seed workflow has already been executed successfully
- **WHEN** the seed workflow is executed again with the same `db.json`
- **THEN** the database contains no duplicate items, machines, or recipes

### Requirement: Seed imports item images when available
The system SHALL import item images referenced by `items[].localImagePath` when the referenced file exists locally and associate the uploaded media to the corresponding item.

#### Scenario: Item image is imported when localImagePath exists
- **GIVEN** an item in `db.json` has a `localImagePath` that points to an existing file under `public/`
- **WHEN** the seed workflow is executed
- **THEN** the item is linked to a corresponding `media` document for that image

### Requirement: Seed imports machine images when available
The system SHALL import machine images referenced by `recipes[].machineImagePath` when the referenced file exists locally and associate the uploaded media to the corresponding machine.

#### Scenario: Machine image is imported when machineImagePath exists
- **GIVEN** a machine image path exists in the dataset and points to an existing file under `public/`
- **WHEN** the seed workflow is executed
- **THEN** the machine is linked to a corresponding `media` document for that image

### Requirement: Missing images do not block seeding
The system SHALL continue importing core recipe data even when one or more referenced image files are missing.

#### Scenario: Missing image is skipped safely
- **GIVEN** an item or machine image path exists but the file is missing on disk
- **WHEN** the seed workflow is executed
- **THEN** the related item or machine is created without an image link and the overall seed completes successfully

### Requirement: Seed treats `db.json` as read-only input
The system SHALL NOT modify `src/data/db.json` as part of the seed workflow.

#### Scenario: Source dataset remains unchanged
- **GIVEN** the seed workflow is executed
- **WHEN** the process completes
- **THEN** `src/data/db.json` remains unchanged on disk
