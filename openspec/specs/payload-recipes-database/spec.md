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

### Requirement: Items include category, rarity, and sort ordering

The system SHALL store item metadata on `items` documents including:

- `category` (relationship to `item-categories`, optional)
- `rarity` (number)
- `sortId` (number, optional)

#### Scenario: Item document includes metadata fields

- **GIVEN** the database has been seeded
- **WHEN** the system retrieves an item document
- **THEN** the item includes `rarity` and (when available) `category` and `sortId`

### Requirement: Item categories are stored as first-class records

The system SHALL store item categories as `item-categories` documents keyed by a unique `name`.

#### Scenario: Item category can be resolved by name

- **GIVEN** the database has been seeded with item categories
- **WHEN** the system queries `item-categories` by `name`
- **THEN** exactly one category document is returned

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

### Requirement: Machines include category, rarity, and craft time

The system SHALL store machine metadata on `machines` documents including:

- `category` (relationship to `machine-categories`, optional)
- `rarity` (number)
- `sortId` (number, optional)
- `craftTime` (number, milliseconds)

#### Scenario: Machine document includes craft time

- **GIVEN** the database has been seeded
- **WHEN** the system retrieves a machine document
- **THEN** the machine includes `rarity` and a `craftTime` field in milliseconds and (when available) `category` and `sortId`

### Requirement: Machine categories are stored as first-class records

The system SHALL store machine categories as `machine-categories` documents keyed by a unique `name`.

#### Scenario: Machine category can be resolved by name

- **GIVEN** the database has been seeded with machine categories
- **WHEN** the system queries `machine-categories` by `name`
- **THEN** exactly one category document is returned

### Requirement: Recipes store relationships to items and machines

The system SHALL store each recipe row as a `recipes` document keyed by `recipeId` with:

- a relationship to a `machine`
- an `ingredients` list where each entry references an `item` and a `count`
- an `outputs` list where each entry references an `item` and a `count`

#### Scenario: Recipe includes ingredient and output relationships

- **GIVEN** the database has been seeded from `src/data/db.json`
- **WHEN** the system retrieves a recipe document
- **THEN** its ingredients and outputs reference existing item documents and include counts

### Requirement: Recipe throughput is derived from its machine

The system SHALL treat recipe craft time as the `craftTime` of the recipe's linked machine.

#### Scenario: Recipe craft time is resolved via machine

- **GIVEN** a recipe exists linked to a machine with `craftTime: 12000`
- **WHEN** the system computes throughput for that recipe
- **THEN** the system uses the machine's `craftTime` value for the calculation

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
