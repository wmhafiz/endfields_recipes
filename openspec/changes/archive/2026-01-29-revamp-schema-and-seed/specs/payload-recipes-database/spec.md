## ADDED Requirements

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

### Requirement: Recipe throughput is derived from its machine

The system SHALL treat recipe craft time as the `craftTime` of the recipe’s linked machine.

#### Scenario: Recipe craft time is resolved via machine

- **GIVEN** a recipe exists linked to a machine with `craftTime: 12000`
- **WHEN** the system computes throughput for that recipe
- **THEN** the system uses the machine’s `craftTime` value for the calculation
