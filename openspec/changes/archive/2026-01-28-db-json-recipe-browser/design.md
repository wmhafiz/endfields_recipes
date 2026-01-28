## Context

The app currently uses `src/data/recipes.json` (hand-curated) with:

- `items[]` and `facilities[]` as separate entity lists
- `recipes[]` referencing items/facilities primarily by **name**
- UI and production-chain logic that often uses `item.name` as the identifier

We now have a scraped dataset `src/data/db.json` that is recipe-centric (array of recipe rows) and includes:

- Stable identifiers:
  - `recipe.id` (unique per recipe row)
  - `ingredients[].itemId` / `outputs[].itemId` (unique item identifiers)
  - `machineId` / `machineName`
- Additional fields we want to expose in the UI:
  - `type` (manual | machine | hub)
  - `category` (e.g., defense, shaping, storage…)
  - `rarity`, `craftTime`, `sortId`, `defaultUnlock`, `description`

Important discovery from the new dataset:

- **Item display names are not globally unique.** Multiple distinct `itemId`s share the same `itemName` (e.g., multiple recipes output "Ferrium Bottle" but with different IDs).
- We need unique URL slugs derived from item names, with disambiguation when collisions occur.

## Goals / Non-Goals

**Goals:**

- Use `db.json` as the canonical and only data source for recipes and items.
- Enrich `db.json` directly (one-time script) with:
  - `slug`: URL-friendly identifier derived from item name (e.g., `Aketine`, `Industrial_Explosive`)
  - `localImagePath`: copied from legacy `recipes.json` where names match
  - Derived fields: `isRawMaterial`, `usesRawMaterial`, etc.
- Build a recipe browser UI with search, filtering, sorting, and grid/list display similar to endfield.gg.
- Remove the `/facilities` page—everything is an item now.
- Ensure all UIs render correctly when `localImagePath` is missing (placeholder instead of broken images).

**Non-Goals:**

- Runtime normalization layer or on-demand mapping logic—all enrichment happens at build/script time.
- Legacy URL redirects (no users to support).
- Fallback to `recipes.json` at runtime.

## Decisions

### 1) URL slugs derived from item names

**Decision:** Generate a `slug` field for each unique item by:
1. Converting item name to URL-friendly format (spaces → underscores, remove special chars except brackets)
2. If collision occurs (same slug, different `itemId`), append a disambiguator (e.g., `_2`, `_3`)

**Rationale:** `/items/Aketine` is more readable and memorable than `/items/item_plant_bbflower_1`.

**Trade-off:** Some items may get suffixed slugs if names collide. Acceptable since this is rare.

### 2) Enrich `db.json` directly (no runtime normalization)

**Decision:** Run a one-time enrichment script that:
- Builds a unique item list from all `ingredients[].itemId` + `outputs[].itemId`
- Generates `slug` for each item
- Matches legacy `recipes.json` items/facilities by name to copy `localImagePath`
- Computes `isRawMaterial` (appears as ingredient but never as output)
- Computes `usesRawMaterial` per recipe (any ingredient is raw)
- Writes enriched data back to `db.json` (or a new `db-enriched.json`)

**Rationale:** Simpler architecture, no runtime overhead, easier debugging. Data is static anyway.

### 3) Remove `/facilities` page

**Decision:** Delete the `/facilities` route and remove it from navigation. Machine filtering is available in the recipe browser.

**Rationale:** The new data model treats everything as items. Facilities/machines are just items that happen to be crafted at the Hub or used as recipe machines.

### 4) Recipe browser is recipe-row driven

**Decision:** The recipe browser list renders one card per recipe row (keyed by `recipe.id`), showing the primary output item as the card display.

**Rationale:** Endfield.gg shows recipe variants (e.g., same output from different machines). This makes variants discoverable via machine/category filters.

### 5) Filter model aligned to available fields

**Decision:** Provide filters that are derivable and stable:

- Search: name + description + ingredient names + machine name
- Recipe Type: `recipe.type` (manual | machine | hub)
- Category: `recipe.category`
- Machine: `recipe.machineName`
- Rarity: `recipe.rarity`
- Uses Raw Material: derived boolean per recipe
- Sorting: default (`sortId`), name, craft time, type, category; with ASC/DESC

### 6) Keep placeholder-first image handling

**Decision:** Keep `localImagePath` optional and reuse `ImageOrPlaceholder` component everywhere.

**Rationale:** Image coverage is incomplete; this prevents broken images and keeps layout stable.

## Enrichment script flow

```text
1. Load src/data/db.json (recipe array)
2. Load src/data/recipes.json (legacy items + facilities)
3. Build itemsById from all ingredients/outputs in db.json
4. For each item:
   a. Generate slug from itemName (handle collisions)
   b. Match legacy data by name → copy localImagePath if found
   c. Compute isRawMaterial (never appears as output)
5. For each recipe:
   a. Compute usesRawMaterial (any ingredient isRawMaterial)
   b. Add output item slug references for easy lookup
6. Write enriched db.json back to disk
```

## Risks / Trade-offs

- **[Duplicate item names → slug collision]** → Mitigation: disambiguate with suffix (`_2`, `_3`). Log collisions during enrichment.
- **[Partial image coverage]** → Mitigation: placeholder UI; `localImagePath` optional.
- **[Name-based enrichment mismatch]** → Mitigation: only enrich optional fields; minor normalization (e.g., "Seed-Picking Unit" → "Seed Picking Unit").
- **[Bundle size]** → Mitigation: enriched `db.json` is still reasonably sized; no duplication.

## Migration Plan

1. Create enrichment script (`src/data/enrich-db.ts`) that transforms `db.json` in place.
2. Run script to produce enriched `db.json` with slugs, image paths, derived fields.
3. Update UI components to use `slug` for routing and `localImagePath` from enriched data.
4. Remove `/facilities` route and navigation link.
5. Commit enriched `db.json` to git.
