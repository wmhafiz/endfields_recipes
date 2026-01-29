## Why

The current schema mixes “catalog metadata” (category, rarity, sorting, craft times, image paths) across `recipes`, `items`, and `machines`, which makes item-centric browsing harder to implement cleanly and makes the seed pipeline brittle. Normalizing these fields onto the correct entities improves maintainability and makes database resets/rebuilds reliable.

## Goals

- Normalize metadata so **items own item metadata** and **machines own machine metadata**.
- Make the seed pipeline support **repeatable reset + rebuild** for fast iteration.
- Remove legacy “image path passthrough” fields and rely on **media relationships** at runtime.
- Keep public read access for `items`, `machines`, `recipes` intact.

## Non-goals

- Implement a new drag/drop production planner UI (to be proposed separately).
- Change game balancing or recipe math beyond normalizing where fields live.
- Introduce new auth/access control rules (still public read).
- Replace Payload Admin UI.

## What Changes

- **BREAKING** `items` schema:
  - Add `category` (relationship to `item-categories`, optional), `rarity` (number), `sortId` (number, optional)
  - Remove `localImagePath` (legacy string path)
- **BREAKING** `machines` schema:
  - Add `category` (relationship to `machine-categories`, optional), `rarity` (number), `sortId` (number, optional), and `craftTime` (number, milliseconds)
  - Remove `machineImagePath` (legacy string path)
- **BREAKING** category normalization:
  - Add new collections `item-categories` and `machine-categories`
  - Replace category text fields with relationships
- **BREAKING** `recipes` schema:
  - Remove `category`
  - Remove `craftTime` (moved to `machines.craftTime`)
- Seed workflow updates:
  - Support an explicit **reset + rebuild** mode to clear and repopulate the DB from source datasets
  - Populate new fields from existing source data (legacy `recipes.json` categories; recipe dataset for rarity/sort ordering; per-machine craft time)
  - Import images by associating `items.image` / `machines.image` media relationships without persisting legacy path fields on the documents

## Rollback Plan

- Revert collection schema changes (restore removed fields, remove newly added fields).
- Regenerate Payload types (`pnpm generate:types`) and import map if needed.
- Re-run seed in idempotent mode to restore the prior database shape.
- If runtime data issues occur during rollout, temporarily enable the existing JSON fallback (`USE_JSON_FALLBACK=true`) while schema is reverted.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `payload-recipes-database`: Normalize where metadata lives (item category/rarity/sortId; machine category/craftTime; recipes without category/craftTime).
- `payload-db-seeding`: Support reset + rebuild, and seed the new schema reliably (including media linkage without storing legacy image-path fields).
- `recipe-data-source`: Update enrichment/transform logic and server-side data loaders to use the new schema and media URLs.
- `recipes-browser`: Adjust filtering/sorting to use normalized fields (item category; machine craft time) and continue to handle missing images gracefully.
- `item-detail-page`: Update any item/machine image lookups to rely on media URLs and the normalized schema.
- `production-chain`: Ensure the existing production chain visualization continues to render correctly after craft time and categories move onto machines/items.

## Impact

- **Payload collections**: `src/collections/Items.ts`, `src/collections/Machines.ts`, `src/collections/Recipes.ts`, plus regenerated `src/payload-types.ts`.
- **Seed & enrichment**: `src/scripts/seed.ts`, `src/data/enrich-db.ts`, and any docs/scripts referencing `localImagePath`/`machineImagePath`.
- **Frontend/UI**: updates to list/detail/browse components and production chain visualization to use `items.category`, media URLs, and `machines.craftTime`.
- **Data correctness requirement**: Enforce that each machine has a single `craftTime` used by all associated recipes (validated/normalized during seed).
