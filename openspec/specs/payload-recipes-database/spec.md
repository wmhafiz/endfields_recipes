## ADDED Requirements

### Requirement: Items are stored as first-class records
The system SHALL store each unique game item as an `items` document keyed by `itemId` and expose a stable `slug` for routing.

#### Scenario: Item can be retrieved by itemId
- **GIVEN** the database has been seeded from `src/data/db.json`
- **WHEN** the system queries the `items` collection for a specific `itemId`
- **THEN** exactly one item document is returned

#### Scenario: Item can be retrieved by slug
- **GIVEN** the database has been seeded from `src/data/db.json`
- **WHEN** the system queries the `items` collection for a specific `slug`
- **THEN** exactly one item document is returned

### Requirement: Machines are stored as first-class records
The system SHALL store crafting machines as `machines` documents keyed by `machineId` and link recipes to the appropriate machine.

#### Scenario: Machine can be retrieved by machineId
- **GIVEN** the database has been seeded from `src/data/db.json`
- **WHEN** the system queries the `machines` collection for a specific `machineId`
- **THEN** exactly one machine document is returned

#### Scenario: Manual crafting is represented as a machine
- **GIVEN** at least one recipe exists with `type: "manual"` in the seed dataset
- **WHEN** the seed process creates machine records
- **THEN** a machine record exists representing manual crafting and manual recipes link to it

### Requirement: Recipes store relationships to items and machines
The system SHALL store each recipe row as a `recipes` document keyed by `recipeId` with:
- a relationship to a `machine`
- an `ingredients` list where each entry references an `item` and a `count`
- an `outputs` list where each entry references an `item` and a `count`

#### Scenario: Recipe includes ingredient and output relationships
- **GIVEN** the database has been seeded from `src/data/db.json`
- **WHEN** the system retrieves a recipe document
- **THEN** its ingredients and outputs reference existing item documents and include counts

### Requirement: Public read access for recipe data
The system SHALL allow unauthenticated read access to `items`, `machines`, and `recipes` so the public site can render data without requiring login.

#### Scenario: Unauthenticated user can read items
- **GIVEN** the system is running
- **WHEN** an unauthenticated request reads from the `items` collection API
- **THEN** the request succeeds and returns item data

### Requirement: Media uploads use Cloudflare R2 storage
The system SHALL configure the Payload `media` upload collection to store uploaded files using the S3 storage adapter with Cloudflare R2 when enabled.

#### Scenario: Uploaded media is persisted via R2
- **GIVEN** R2 storage is configured and enabled
- **WHEN** an admin uploads a file to the `media` collection
- **THEN** the uploaded file is stored using Cloudflare R2 and is retrievable via its URL
