## ADDED Requirements

### Requirement: Enrich `db.json` with URL-friendly slugs

The system SHALL enrich `db.json` items with a `slug` field derived from the item name.

#### Scenario: Slug is generated from item name

- **GIVEN** an item with `itemName: "Industrial Explosive"`
- **WHEN** the enrichment script runs
- **THEN** the item has `slug: "Industrial_Explosive"`

#### Scenario: Slug handles special characters

- **GIVEN** an item with `itemName: "Buck Capsule [A]"`
- **WHEN** the enrichment script runs
- **THEN** the item has a URL-friendly slug like `"Buck_Capsule_A"` (brackets removed or replaced)

#### Scenario: Slug collision is disambiguated

- **GIVEN** two items with the same `itemName` but different `itemId` values
- **WHEN** the enrichment script runs
- **THEN** slugs are disambiguated with a suffix (e.g., `"Ferrium_Bottle"`, `"Ferrium_Bottle_2"`)

### Requirement: Enrich `db.json` with legacy image paths

The system SHALL enrich `db.json` items with `localImagePath` from legacy `recipes.json` where names match.

#### Scenario: Legacy image path is copied when names match

- **GIVEN** legacy `recipes.json` contains an item named "Aketine" with `localImagePath: "images/items/Aketine.png"`
- **AND** `db.json` contains an item with `itemName: "Aketine"`
- **WHEN** the enrichment script runs
- **THEN** the enriched item has `localImagePath: "images/items/Aketine.png"`

#### Scenario: Missing legacy image path remains undefined

- **GIVEN** `db.json` contains an item with `itemName: "Wood"`
- **AND** legacy `recipes.json` has no image for "Wood"
- **WHEN** the enrichment script runs
- **THEN** the enriched item has no `localImagePath` field

### Requirement: Compute raw material status

The system SHALL compute and store `isRawMaterial` for each item.

#### Scenario: Raw-only item is marked

- **GIVEN** an item that appears as an ingredient but never as an output in any recipe
- **WHEN** the enrichment script runs
- **THEN** the item has `isRawMaterial: true`

#### Scenario: Craftable item is not marked as raw

- **GIVEN** an item that appears as an output in at least one recipe
- **WHEN** the enrichment script runs
- **THEN** the item has `isRawMaterial: false` (or field is omitted)

### Requirement: Compute recipe uses raw material

The system SHALL compute and store `usesRawMaterial` for each recipe.

#### Scenario: Recipe with raw ingredient is marked

- **GIVEN** a recipe that includes an ingredient with `isRawMaterial: true`
- **WHEN** the enrichment script runs
- **THEN** the recipe has `usesRawMaterial: true`

#### Scenario: Recipe with no raw ingredients is not marked

- **GIVEN** a recipe where all ingredients are craftable items
- **WHEN** the enrichment script runs
- **THEN** the recipe has `usesRawMaterial: false` (or field is omitted)

### Requirement: Enrichment is idempotent

The system SHALL produce the same output when the enrichment script is run multiple times.

#### Scenario: Re-running enrichment produces identical output

- **GIVEN** the enrichment script has already been run on `db.json`
- **WHEN** the script is run again
- **THEN** the output is identical (no duplicate fields, no changed slugs)

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
