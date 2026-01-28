## ADDED Requirements

### Requirement: Payload database is the canonical runtime data source
The system SHALL treat the Payload/PostgreSQL database as the canonical runtime data source for items, machines, and recipes. The file `src/data/db.json` SHALL be used as seed/import input rather than as the runtime source of truth.

#### Scenario: Item detail loads from the database
- **GIVEN** the database has been seeded from `src/data/db.json`
- **WHEN** the user navigates to an item detail route (`/items/[slug]`)
- **THEN** the item is resolved from the database (not by directly importing `db.json`)

#### Scenario: Recipe browsing loads from the database
- **GIVEN** the database has been seeded from `src/data/db.json`
- **WHEN** the user views the recipe browser UI
- **THEN** recipe rows are loaded from the database (not by directly importing `db.json`)
