## ADDED Requirements

### Requirement: Display complete production chain

The system SHALL display the complete production dependency tree for any item, showing all ancestor items and facilities required to produce it.

#### Scenario: View production chain for craftable item

- **GIVEN** an item that has a recipe (e.g., Industrial Explosive)
- **WHEN** user views the item detail page
- **THEN** the production chain shows all ancestor dependencies recursively (Amethyst Part → Amethyst Fiber → Amethyst Ore, AND Aketine Powder → Aketine → Aketine Seed)

#### Scenario: View production chain for raw material

- **GIVEN** an item that has no recipe (raw material like Amethyst Ore)
- **WHEN** user views the item detail page
- **THEN** the production chain shows only the single item node with no dependencies

### Requirement: Horizontal left-to-right layout

The system SHALL render the production chain graph with horizontal left-to-right orientation, with raw materials on the left and the final product on the right.

#### Scenario: Graph flows left to right

- **GIVEN** a production chain with multiple levels
- **WHEN** the graph is rendered
- **THEN** raw materials appear on the left edge, intermediate items in the middle, and the target item on the right edge

### Requirement: Custom item nodes

The system SHALL display items as custom nodes showing the item image and name.

#### Scenario: Item node displays correctly

- **GIVEN** an item in the production chain
- **WHEN** the node is rendered
- **THEN** the node displays the item's image and name in a styled container matching the game aesthetic

#### Scenario: Raw material indicator

- **GIVEN** an item with no recipe (terminal node)
- **WHEN** the node is rendered
- **THEN** the node displays a visual indicator that it is a raw material

### Requirement: Custom facility nodes

The system SHALL display facilities as custom nodes showing the facility image, name, and processing time.

#### Scenario: Facility node displays correctly

- **GIVEN** a facility in the production chain
- **WHEN** the node is rendered
- **THEN** the node displays the facility image, name, and processing time (e.g., "⏱ 2s")

### Requirement: Pan and zoom controls

The system SHALL allow users to pan and zoom the production chain graph.

#### Scenario: User pans the graph

- **GIVEN** a production chain graph is displayed
- **WHEN** user drags the graph background
- **THEN** the viewport pans in the drag direction

#### Scenario: User zooms the graph

- **GIVEN** a production chain graph is displayed
- **WHEN** user scrolls or uses zoom controls
- **THEN** the graph zooms in or out centered on the cursor/viewport

### Requirement: Click node to navigate

The system SHALL allow users to click on item nodes to navigate to that item's detail page.

#### Scenario: Navigate to item via node click

- **GIVEN** a production chain is displayed
- **WHEN** user clicks on an item node
- **THEN** the browser navigates to that item's detail page (`/items/[id]`)

### Requirement: Collapse and expand branches

The system SHALL allow users to collapse and expand branches of the production chain.

#### Scenario: Collapse a branch

- **GIVEN** an item node with dependencies (not a raw material)
- **WHEN** user clicks the collapse control on the node
- **THEN** all ancestor nodes in that branch are hidden, and the node displays a badge showing the count of hidden nodes (e.g., "+3")

#### Scenario: Expand a collapsed branch

- **GIVEN** a collapsed item node with hidden dependencies
- **WHEN** user clicks the expand control on the node
- **THEN** all previously hidden ancestor nodes in that branch become visible

### Requirement: Depth limit control

The system SHALL provide a control to limit how many levels of dependencies are shown.

#### Scenario: Apply depth limit

- **GIVEN** a production chain with depth greater than N
- **WHEN** user sets the depth limit to N
- **THEN** the graph only shows N levels of ancestors, with deeper nodes hidden

#### Scenario: No depth limit by default

- **GIVEN** user has not set a depth limit
- **WHEN** the production chain is displayed
- **THEN** all levels of dependencies are shown (no limit applied)

### Requirement: Multiple recipe selection

The system SHALL allow users to select between multiple recipes when an item can be produced in more than one way.

#### Scenario: Item with multiple recipes shows selector

- **GIVEN** an item that has multiple recipes (e.g., Originium Powder from Originium Ore OR Regenium Ore)
- **WHEN** the production chain is displayed
- **THEN** a recipe selector appears allowing the user to choose which recipe path to display

#### Scenario: Switching recipes updates graph

- **GIVEN** an item with multiple recipes and a recipe selector is visible
- **WHEN** user selects a different recipe
- **THEN** the production chain graph updates to show the selected recipe's dependency path

### Requirement: Cycle detection

The system SHALL detect and handle circular references in recipe data to prevent infinite loops.

#### Scenario: Circular reference in data

- **GIVEN** recipe data contains a circular reference (item A requires item B, which requires item A)
- **WHEN** the production chain is built
- **THEN** the cycle is broken at the first repeated item, preventing infinite recursion
