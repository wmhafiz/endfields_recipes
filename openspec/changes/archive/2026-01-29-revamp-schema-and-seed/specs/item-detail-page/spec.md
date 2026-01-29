## ADDED Requirements

### Requirement: Item detail renders item image via media when available

The system SHALL render an item’s image on the item detail page when an image is linked via the item’s media relationship and SHALL render a placeholder when no image is available.

#### Scenario: Item image is displayed

- **GIVEN** an item exists with a linked media image
- **WHEN** the user navigates to that item’s detail page
- **THEN** the item’s image is displayed

#### Scenario: Missing item image uses placeholder

- **GIVEN** an item exists with no linked media image
- **WHEN** the user navigates to that item’s detail page
- **THEN** a placeholder is displayed in place of the image
