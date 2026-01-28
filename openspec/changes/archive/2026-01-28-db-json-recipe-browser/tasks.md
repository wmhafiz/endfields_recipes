## 1. Enrichment script

- [x] 1.1 Create `src/data/enrich-db.ts` script that:
  - Loads `db.json` (recipe array)
  - Loads `recipes.json` (legacy items + facilities for image paths)
  - Builds unique item list from all `ingredients[].itemId` + `outputs[].itemId`
- [x] 1.2 Implement slug generation:
  - Convert item name to URL-friendly slug (spaces → underscores, remove/replace special chars)
  - Handle collisions (same slug, different itemId) with suffix (`_2`, `_3`)
- [x] 1.3 Implement legacy image enrichment:
  - Match by item name (with minor normalization for punctuation differences)
  - Copy `localImagePath` from legacy data when matched
- [x] 1.4 Compute derived fields:
  - `isRawMaterial`: item appears as ingredient but never as output
  - `usesRawMaterial`: recipe has at least one raw material ingredient
- [x] 1.5 Write enriched data back to `db.json` (update items in-place within recipe structure, or add a top-level `items` index)
- [x] 1.6 Run enrichment script and commit enriched `db.json`

## 2. TypeScript types

- [x] 2.1 Add/update types for enriched `db.json`:
  - Recipe type with all fields (id, type, category, machine, rarity, craftTime, ingredients, outputs, usesRawMaterial, etc.)
  - Item type with slug, localImagePath?, isRawMaterial
- [x] 2.2 Export types from `src/app/(frontend)/types/` for use across components

## 3. Recipe browser UI (endfield.gg-style)

- [x] 3.1 Create a recipe browser component that renders one card per recipe row
- [x] 3.2 Add search that matches output name, description, ingredient names, and machine name
- [x] 3.3 Add filters: recipe type, category, machine, rarity, uses raw material
- [x] 3.4 Add sorting: default (`sortId`), name, craft time, type, category + ASC/DESC order
- [x] 3.5 Add grid/list view toggle and show result count + empty-state messaging
- [x] 3.6 Ensure cards use `ImageOrPlaceholder` for missing images

## 4. Items list route (`/items`)

- [x] 4.1 Update items list page to use enriched `db.json` items (unique by itemId/slug)
- [x] 4.2 Ensure item cards link to `/items/[slug]`
- [x] 4.3 Ensure missing images render placeholders

## 5. Item detail page (`/items/[slug]`)

- [x] 5.1 Update item detail lookup to resolve items by `slug` (not legacy IDs)
- [x] 5.2 Update "Produced By" and "Used In" sections to use enriched data
- [x] 5.3 Ensure back navigation returns to the items list (`/items`)
- [x] 5.4 Ensure recipe cards render images/placeholders correctly

## 6. Production chain updates

- [x] 6.1 Update production chain builder to use `itemId` for node identity internally
- [x] 6.2 Update node click navigation to route by `slug`
- [x] 6.3 Ensure recipe-variant selection works with enriched data

## 7. Remove facilities page

- [x] 7.1 Delete `/facilities` route and page component
- [x] 7.2 Remove "Facilities" link from main navigation
- [x] 7.3 Delete `FacilityCard` component if no longer used

## 8. Verification & cleanup

- [x] 8.1 Run `pnpm lint` and `tsc --noEmit` to confirm no type/lint errors
- [x] 8.2 Manual smoke test: recipe browser loads, filters work, clicking card navigates to item detail
- [x] 8.3 Remove unused legacy code/types that referenced old `recipes.json` structure
