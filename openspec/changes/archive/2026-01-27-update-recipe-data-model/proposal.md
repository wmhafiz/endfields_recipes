## Why

We’ve expanded `src/data/recipes.json` to better reflect the game (facility metadata, recipe quantities, more items/recipes). The frontend currently assumes the old schema (e.g. `recipe.inputs: string[]` and `recipe.processingTime`), which will break production chain rendering, item detail recipe views, and image rendering once optional fields are encountered.

We also want to make the new facility metadata usable in the UI by adding a dedicated facilities route.

## What Changes

- **Update data model types** to match the new `recipes.json` schema:
  - Facilities gain `category`, `processingTime`, `description`
  - Recipes change `inputs` to `{ item, quantity }[]`, gain optional `outputQuantity` and `notes`
  - Some item/facility properties become optional and must be handled safely
- **Update production chain logic + UI** to use per-recipe quantities and facility-based `processingTime`
- **Update item detail recipe displays** to show input quantities and output quantity; render `notes` subtly
- **Add items category filtering** to the items list/grid UI
- **Add a dedicated facilities route** with facility details and related products/recipes
- **Gracefully handle missing images** by rendering a text-based placeholder box when `localImagePath` is absent

## Goals

- The app renders correctly with the updated `recipes.json` schema (no runtime errors from shape mismatches).
- Production chain and recipe cards display **per-recipe input quantities** and (when present) `outputQuantity`.
- Facility nodes display `processingTime` sourced from the facility (not per-recipe), when available.
- Items list supports filtering by `item.category`.
- A new `/facilities` page lists facilities and shows a “Related” section (recipes/products that use that facility).
- Missing images do not break layout; the UI shows a consistent placeholder with the item/facility name.
- Notes are displayed **subtly** (muted text / small inline hint), not as prominent alerts.

## Non-goals

- **No cumulative quantity rollups** across the full chain (only show quantities as defined per recipe edge).
- No new CMS/admin editing UI for recipes/items/facilities (data remains from static JSON).
- No requirement to backfill missing images in this change (only handle display gracefully).

## Capabilities

### New Capabilities

- `facilities-page`: Dedicated route (`/facilities`) that lists facilities (grouped or filterable by category) and shows:
  - facility image/placeholder, name, category
  - description and processing time (when present)
  - related recipes/products (outputs produced by the facility and/or recipes that use it)

### Modified Capabilities

- `production-chain`: Update to support quantified inputs and facility-sourced processing time, with image fallbacks.
- `item-detail-page`: Update recipe sections to display quantified inputs, optional output quantity, subtle notes, and image fallbacks.
- `items-list`: Update the items list UI to support category filtering and image fallbacks.

## Impact

- **Data schema** (already updated): `src/data/recipes.json`
  - `recipes[].inputs` becomes `{ item: string; quantity: number }[]`
  - `recipes[].processingTime` removed (time lives on `facilities[].processingTime`)
  - `recipes[].outputQuantity?`, `recipes[].notes?`
  - `facilities[].category`, `facilities[].processingTime?`, `facilities[].description?`
  - optional `localImagePath` and optional `category` on items
- **Frontend code changes** (expected):
  - Update type definitions in `src/app/(frontend)/utils/buildProductionChain.ts`
  - Update production chain components/hooks to pass quantities along edges
  - Update `src/app/(frontend)/items/[id]/page.tsx` to compute “Used In” via quantified inputs
  - Update `src/app/(frontend)/components/ItemsDisplay.tsx` to filter by category and handle missing images
  - Add new route under `src/app/(frontend)/facilities/` plus supporting components/styles

## Rollback Plan

- Revert the commit(s) updating `src/data/recipes.json` and the associated TS/UI changes.
- Remove the `/facilities` route and category-filter UI if needed.
- Because this is static JSON + frontend-only, rollback is a straightforward git revert with no DB migrations.

