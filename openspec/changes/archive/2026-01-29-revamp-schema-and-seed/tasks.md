## 1. Update Payload schemas (breaking changes)

- [x] 1.1 Add `item-categories` collection (unique `name`, optional `sortId`) with public read access
- [x] 1.2 Add `machine-categories` collection (unique `name`, optional `sortId`) with public read access
- [x] 1.3 Update `items` collection schema: add `category` relationship to `item-categories` (optional), `rarity`, optional `sortId`; remove `localImagePath`
- [x] 1.4 Update `machines` collection schema: add `category` relationship to `machine-categories` (optional), `rarity`, optional `sortId`, `craftTime`; remove `machineImagePath`
- [x] 1.3 Update `recipes` collection schema: remove `category` and `craftTime` fields; ensure relationships + existing fields remain intact
- [x] 1.5 Run `pnpm generate:types` and verify `src/payload-types.ts` reflects schema changes

## 2. Update seed workflow (reset + rebuild + new fields)

- [x] 2.1 Add `--reset` option to `src/scripts/seed.ts` to delete existing docs in order: recipes → machines → items → (optional) media
- [x] 2.2 Update media import pipeline to dedupe by `media.sourcePath` and link `items.image` / `machines.image` without storing legacy image-path fields on the documents
- [x] 2.3 Upsert `item-categories` from legacy `src/data/recipes.json` category names and link `items.category` when available (otherwise leave empty)
- [x] 2.4 Upsert `machine-categories` from legacy `src/data/recipes.json` facility category names and link `machines.category` when available (otherwise leave empty)
- [x] 2.5 Populate `items.rarity` and optional `items.sortId` from source data (omit sortId when unavailable)
- [x] 2.6 Populate `machines.rarity` (default 0 unless a reliable source exists) and optional `machines.sortId` (omit when unavailable)
- [x] 2.7 Derive `machines.craftTime` from associated machine recipes; if inconsistent input is detected, log a warning and choose a deterministic craft time (document the rule in code)
- [x] 2.8 Ensure seed remains idempotent when `--reset` is not used (upserts, no duplicates)
- [x] 2.9 Run seed end-to-end locally: first on empty DB, then re-run (idempotency), then run with `--reset`

## 3. Update enrichment inputs (db.json / legacy mapping)

- [x] 3.1 Update `src/data/enrich-db.ts` to stop enriching `db.json` with legacy `localImagePath` and `machineImagePath`
- [x] 3.2 Ensure enrichment still produces stable slugs and `isRawMaterial` / `usesRawMaterial`
- [x] 3.3 Validate enrichment output remains deterministic and does not modify `db.json` during seeding

## 4. Update server-side data loader shape

- [x] 4.1 Update `src/app/(frontend)/data/payload.ts` to return the canonical frontend shape using media URLs (not legacy path fields)
- [x] 4.2 Ensure recipe rows surface machine craft time via the linked machine (since recipes no longer store craftTime)
- [x] 4.3 Ensure item category/rarity/sortId and machine category/rarity/craftTime are available where UIs need them

## 5. Update frontend pages/components to use normalized fields

- [x] 5.1 Update recipe browser filters: replace recipe `category` filter with output item `category`; replace recipe craft-time sorting with machine craft time
- [x] 5.2 Update all UI image rendering paths to use media URLs (and keep placeholder behavior for missing images)
- [x] 5.3 Update item detail view: ensure produced-by/used-in sections render correctly with new fields
- [x] 5.4 Update production chain: facility node displays machine craft time (from machine), and item nodes continue to navigate by slug

## 6. Validation and cleanup

- [x] 6.1 Run `pnpm lint` and `pnpm exec tsc --noEmit` to validate TypeScript + linting
- [x] 6.2 Run `pnpm test:int` (and e2e if desired) to confirm no regressions
- [x] 6.3 Remove/replace any remaining references to `localImagePath`, `machineImagePath`, `recipe.category`, and `recipe.craftTime` across the codebase
