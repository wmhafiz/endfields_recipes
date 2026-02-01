## ADDED Requirements

### Requirement: Recipe browser state persists in URL

The system SHALL synchronize recipe browser filter, search, and sort state with URL query parameters.

#### Scenario: Filters reflected in URL

- **GIVEN** the user is on the recipe browser page
- **WHEN** the user applies filters (type, category, machine, rarity, raw material usage)
- **THEN** the URL query parameters update to reflect the current filter state

#### Scenario: Search query reflected in URL

- **GIVEN** the user is on the recipe browser page
- **WHEN** the user enters a search query
- **THEN** the URL includes the search query as a parameter (e.g., `?q=steel`)

#### Scenario: Sort settings reflected in URL

- **GIVEN** the user is on the recipe browser page
- **WHEN** the user changes sort field or direction
- **THEN** the URL includes sort parameters (e.g., `?sort=name&dir=desc`)

### Requirement: URL state restores on page load

The system SHALL restore filter, search, and sort state from URL query parameters when the recipe browser page loads.

#### Scenario: Filters restored from URL

- **GIVEN** a URL with filter parameters (e.g., `?type=machine&cat=AIC+Products`)
- **WHEN** the user navigates to that URL
- **THEN** the recipe browser displays with those filters pre-applied

#### Scenario: Search restored from URL

- **GIVEN** a URL with a search parameter (e.g., `?q=explosive`)
- **WHEN** the user navigates to that URL
- **THEN** the search input shows the query and results are filtered accordingly

#### Scenario: Sort restored from URL

- **GIVEN** a URL with sort parameters (e.g., `?sort=craftTime&dir=asc`)
- **WHEN** the user navigates to that URL
- **THEN** the recipes are sorted by craft time ascending

### Requirement: View mode persists in URL

The system SHALL include view mode (grid/list) in URL state.

#### Scenario: View mode reflected in URL

- **GIVEN** the user is viewing the recipe browser
- **WHEN** the user switches between grid and list view
- **THEN** the URL includes the view mode parameter (e.g., `?view=list`)

#### Scenario: View mode restored from URL

- **GIVEN** a URL with view parameter `?view=list`
- **WHEN** the user navigates to that URL
- **THEN** the recipe browser displays in list view

### Requirement: Default values omitted from URL

The system SHALL omit query parameters that match default values to keep URLs clean.

#### Scenario: Default filter not in URL

- **GIVEN** the user has all filters set to "All" (default)
- **WHEN** the URL is generated
- **THEN** no filter parameters appear in the URL

#### Scenario: Default sort not in URL

- **GIVEN** the user has sort set to "default" ascending (default)
- **WHEN** the URL is generated
- **THEN** no sort parameters appear in the URL

### Requirement: URL updates without page reload

The system SHALL update the URL without causing a full page reload when filters change.

#### Scenario: Filter change updates URL in-place

- **GIVEN** the user is on the recipe browser
- **WHEN** the user changes a filter
- **THEN** the URL updates and the page does not reload (state preserved)

### Requirement: Clear filters resets URL

The system SHALL remove all filter parameters from the URL when the user clears filters.

#### Scenario: Clear filters clears URL params

- **GIVEN** the user has multiple filters applied (reflected in URL)
- **WHEN** the user clicks "Clear Filters"
- **THEN** all filter/search/sort parameters are removed from the URL
