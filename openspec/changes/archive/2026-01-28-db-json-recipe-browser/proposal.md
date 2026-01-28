## Why

The current app is backed by a small, hand-curated `recipes.json` that limits coverage and makes it hard to support a richer recipe browsing experience. We now have a larger scraped dataset (`src/data/db.json`) with stable IDs and more fields that can power better search, filtering, and sorting.

## Goals

- Use `src/data/db.json` as the canonical recipe source (stable IDs, richer metadata).
- Enrich `db.json` directly with `localImagePath` and a URL-friendly `slug` derived from item names (e.g., `Aketine`, `Industrial_Explosive`) for routing.
- Update the UI to a "recipe browser" experience similar to endfield.gg (search + multi-filters + sorting).
- Ensure missing images are handled gracefully (placeholders; `localImagePath` optional everywhere).

## Non-goals

- Fetching remote image URLs or building an automated asset pipeline for all new items.
- Building a server-backed database/API for recipes (data remains static JSON for now).
- Perfect parity with endfield.gg's taxonomy; we will only expose filters that can be derived reliably from `db.json`.
- Runtime normalization layer or on-demand mapping logic—enrich the data file directly.
- Legacy URL redirects (no existing users to support).

## What Changes

- Switch primary data source from `src/data/recipes.json` to `src/data/db.json`.
- Run a one-time enrichment script to update `db.json` directly:
  - Add `slug` field to items (URL-friendly, derived from item name, e.g. `Aketine`, `Industrial_Explosive`).
  - Add `localImagePath` from legacy `recipes.json` where names match.
  - Compute derived fields (e.g. `isRawMaterial`, `usesRawMaterial`) and store them in the JSON.
- Everything is an "item" now—no separate facilities/machines split. Remove the `/facilities` page.
- Add browser controls:
  - Search across name/description and optionally ingredients/machine.
  - Filters: recipe type, category, machine, rarity, "uses raw material".
  - Sorting: default (sortId), name, craft time, type, category; with ASC/DESC order.
- Item detail URLs will use the new `slug` (e.g. `/items/Aketine`) instead of the internal `itemId`.

## Capabilities

### New Capabilities
- `recipe-data-source`: Define how `db.json` is enriched with slugs, image paths, and derived fields.
- `recipes-browser`: Define the recipe browsing UI (search, filtering, sorting, and list/grid presentation).

### Modified Capabilities
- `items-list`: The home list shifts from "items in recipes.json" to "recipe outputs from db.json" with richer filters and sorting.
- `item-detail-page`: Item detail now resolves items by `slug` and displays recipe variants from `db.json`.
- `production-chain`: Production chain uses `slug` for routing and supports multiple recipes per output.

### Removed Capabilities
- `facilities-page`: Removed—everything is an item now; machine filtering is available in the recipe browser.

## Impact

- **Data**: One-time enrichment script updates `db.json` with slugs, image paths, and derived fields. No runtime normalization layer.
- **Frontend**: Updates to list page, detail page, and production chain to use the new `slug` for routing and lookups.
- **UX**: Improved discovery via richer filters/sorting; placeholder imagery must remain readable and visually consistent.
- **Navigation**: Remove `/facilities` route and nav link.

## Rollback plan

- `db.json` changes are committed to git; rollback by reverting the enrichment commit.
- No runtime fallback or feature flags needed—this is a clean data migration.
