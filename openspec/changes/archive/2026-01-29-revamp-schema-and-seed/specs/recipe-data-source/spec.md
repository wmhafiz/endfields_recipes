## REMOVED Requirements

### Requirement: Enrich `db.json` with legacy image paths

**Reason**: Runtime images are resolved via Payload `media` relationships and `db.json` no longer carries legacy path fields.
**Migration**: Use the seed workflow to import images into the `media` collection (deduped by `media.sourcePath`) and link `items.image` / `machines.image`. Do not rely on `items[].localImagePath` or `recipes[].machineImagePath` for runtime rendering.

## ADDED Requirements

### Requirement: Runtime UI resolves item and machine images via media

The system SHALL resolve item and machine images from Payload `media` relationships and render placeholders when no media URL is available.

#### Scenario: Missing media shows placeholder

- **GIVEN** an item exists with no linked media image
- **WHEN** the item is rendered in the UI
- **THEN** a placeholder is displayed instead of a broken image
