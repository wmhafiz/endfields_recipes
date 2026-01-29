## ADDED Requirements

### Requirement: Production chain facility nodes display machine craft time

The system SHALL display machine craft time on facility nodes in the production chain when a non-zero `machines.craftTime` is available.

#### Scenario: Facility node shows craft time

- **GIVEN** a production chain is displayed for an item produced by a machine with a non-zero craft time
- **WHEN** the facility node is rendered
- **THEN** the UI displays the machine craft time value in a human-readable form

#### Scenario: Facility node omits craft time when absent

- **GIVEN** a production chain is displayed for an item produced by a machine with `craftTime: 0` (or missing)
- **WHEN** the facility node is rendered
- **THEN** the facility node does not display a craft time label
