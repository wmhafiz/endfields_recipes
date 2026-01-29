## ADDED Requirements

### Requirement: Production planner route

The system SHALL provide a dedicated production planner experience where users can configure one or more target items and generate a production chain visualization.

#### Scenario: User navigates to the planner

- **GIVEN** the application is running
- **WHEN** the user navigates to the production planner route (e.g. `/planner`)
- **THEN** the planner UI is rendered with an item sidebar, a central canvas area, and a right-side planning/inspector area

### Requirement: Left sidebar item browser

The system SHALL display a left collapsible sidebar containing a searchable list of items.

#### Scenario: Search filters items in the sidebar

- **GIVEN** the planner page is displayed with an items sidebar
- **WHEN** the user enters a search query
- **THEN** the sidebar list updates to show only items whose name (or identifier) matches the query

#### Scenario: User collapses the item sidebar

- **GIVEN** the planner page is displayed
- **WHEN** the user collapses the item sidebar
- **THEN** the canvas area expands to use the freed space

### Requirement: Item inspector sheet

The system SHALL display an inspector sheet on the right side of the screen for the currently selected item.

#### Scenario: Clicking an item opens the inspector

- **GIVEN** the planner page is displayed
- **WHEN** the user clicks an item in the left sidebar
- **THEN** the right-side inspector displays the item’s details and available recipes

### Requirement: Recipe list for an item

The system SHALL list all recipes that can produce the selected item in the inspector.

#### Scenario: Inspector lists recipes producing the selected item

- **GIVEN** the user has selected an item that is produced by one or more recipes
- **WHEN** the inspector renders the recipe list
- **THEN** the available producing recipes are displayed for that item

### Requirement: Filter recipes by raw-material usage

The system SHALL allow the user to filter the producing recipes list based on whether the recipe uses at least one raw material ingredient.

#### Scenario: Filter for recipes that use raw materials

- **GIVEN** the inspector is showing producing recipes for an item
- **WHEN** the user enables the “uses raw materials” filter
- **THEN** only recipes marked as using raw materials are displayed

### Requirement: Filter recipes by ingredient input

The system SHALL allow the user to filter the producing recipes list by selected ingredient input(s).

#### Scenario: Filter recipes by selected ingredient

- **GIVEN** the inspector is showing producing recipes for an item
- **WHEN** the user filters for recipes that include a specific ingredient item
- **THEN** only producing recipes whose ingredient list includes that item are displayed

### Requirement: Add a recipe to the selected plan

The system SHALL allow the user to choose a producing recipe for an item and add it to a “Selected Recipes / Targets” list for plan generation.

#### Scenario: Add selected recipe to the plan

- **GIVEN** the inspector is showing producing recipes for an item
- **WHEN** the user selects one recipe and adds it to the plan
- **THEN** the recipe appears in the “Selected Recipes / Targets” list

### Requirement: Configure target production rate per minute

The system SHALL allow the user to set a target quantity-per-minute rate for each selected target item in the plan.

#### Scenario: User sets qty/min for a selected target

- **GIVEN** an item recipe has been added to the “Selected Recipes / Targets” list
- **WHEN** the user sets the target rate (qty/min) for that item
- **THEN** the plan stores and displays the configured qty/min for that target

### Requirement: Draft statistics before generation

The system SHALL display summary statistics for the current plan configuration before generating the production chain.

#### Scenario: Total target output per minute is shown

- **GIVEN** the user has one or more targets with qty/min configured
- **WHEN** the planner displays the plan summary
- **THEN** the total target output per minute across all configured targets is displayed

### Requirement: Ratio / multi-line generation mode

The system SHALL allow users to choose whether the generated plan may use fractional machine counts or must be represented as whole-number ratios by scaling into multiple lines.

#### Scenario: User enables whole-number ratio generation

- **GIVEN** the planner configuration is displayed
- **WHEN** the user enables whole-number ratio generation (multi-line mode)
- **THEN** the generated plan is allowed to scale to whole-number machine ratios rather than requiring fractional machine counts

### Requirement: Build production line from selected targets

The system SHALL generate a production chain graph from the selected targets when the user triggers “Build production line”.

#### Scenario: Build generates a production chain graph

- **GIVEN** the user has selected one or more target recipes and configured qty/min
- **WHEN** the user clicks “Build production line”
- **THEN** the system calculates the combined production chain and renders it on the React Flow canvas

### Requirement: Drag and drop items onto the canvas

The system SHALL allow users to drag items from the sidebar and drop them onto the React Flow canvas to add them as targets for planning.

#### Scenario: Dragging an item into the canvas adds a target

- **GIVEN** the planner page is displayed with an items sidebar and an empty canvas
- **WHEN** the user drags an item from the sidebar and drops it onto the canvas
- **THEN** the item is added to the plan as a selectable target (and becomes available for recipe selection and qty/min configuration)

### Requirement: Layout configuration after generation

The system SHALL allow users to change the layout orientation of the generated production chain visualization.

#### Scenario: User switches to vertical layout

- **GIVEN** a production chain is generated and visible on the canvas
- **WHEN** the user selects a vertical layout option
- **THEN** the system re-lays out the graph vertically without changing the underlying plan

### Requirement: Yield vs needed visualization and bottleneck highlighting

The system SHALL display yield-versus-needed information for the generated plan and SHALL highlight bottlenecks where produced output is below required output.

#### Scenario: Bottleneck is highlighted when yield is insufficient

- **GIVEN** a generated plan contains at least one node whose computed yield per minute is less than its required per minute
- **WHEN** the planner renders yield vs needed overlays
- **THEN** the system highlights the bottleneck node(s) and indicates the yield vs needed values

### Requirement: High-quality node interaction UX

The system SHALL provide a clear interaction model for working with nodes on the canvas (selection, inspection, and navigation within the planner).

#### Scenario: Selecting a node updates the inspector

- **GIVEN** a production chain is displayed on the canvas
- **WHEN** the user selects a node
- **THEN** the inspector updates to show details for the selected node (item or facility) without leaving the planner page
