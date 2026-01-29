## Context

The app currently includes item browsing and item detail views (including a production chain visualization). The current model stores “catalog metadata” across multiple entities (e.g., recipe category and craft time) and persists legacy image-path fields (`localImagePath`, `machineImagePath`) that are only needed for initial media imports. This makes the schema harder to iterate on and makes item-centric browsing (items grouped by category) harder to implement cleanly.

Constraints:

- Tech stack: Next.js 15 + React 19 + Payload 3 + Postgres, `@xyflow/react` (React Flow) and dagre.
- Public site requires unauthenticated read access to items/machines/recipes.
- Seeding must support fast iteration: reset → rebuild in a predictable way.

## Goals / Non-Goals

**Goals:**

- Normalize fields:
  - `items` own `category`, `rarity`, `sortId`
  - `machines` own `category`, `craftTime` (ms)
  - `recipes` do not store category/craftTime
- Replace legacy image-path fields with media relationships at runtime (images still dedupe via `media.sourcePath`).
- Keep existing public UI behavior working (items list, item detail, recipe browser, production chain visualization) while fields move to the normalized schema.

**Non-Goals:**

- Replacing Payload Admin UI or changing auth/access policies.
- Implementing a new drag/drop production planner UI (to be proposed separately).
- Overhauling game data beyond relocating fields to the correct entities.

## Decisions

### 1) Data model normalization (Payload collections)

- **Items**
  - Add:
    - `category` (relationship to `item-categories`, optional)
    - `rarity` (number)
    - `sortId` (number, optional)
  - Keep: `itemId`, `itemName`, `slug`, `isRawMaterial`, `image` (media relationship)
  - Remove: `localImagePath`

- **Machines**
  - Add:
    - `category` (relationship to `machine-categories`, optional)
    - `rarity` (number)
    - `sortId` (number, optional)
    - `craftTime` (number, ms)
  - Keep: `machineId`, `machineName`, `image` (media relationship)
  - Remove: `machineImagePath`

- **Item Categories**
  - New collection: `item-categories` keyed by a unique `name`
  - Optional `sortId` for ordering

- **Machine Categories**
  - New collection: `machine-categories` keyed by a unique `name`
  - Optional `sortId` for ordering

- **Recipes**
  - Keep: `recipeId`, `name`, `description`, `type`, `machine` relationship, `ingredients[]`, `outputs[]`, `rarity`, `sortId`, `defaultUnlock`, `usesRawMaterial`
  - Remove: `category`, `craftTime`

**Rationale:** category/rarity/sorting are item properties for browsing; craft time is a machine property for throughput calculations; removing legacy path fields prevents “two sources of truth” for images (string paths vs uploaded media URLs).

**Alternatives considered:**

- Keep recipe category: rejected because item-level grouping is needed and multiple recipes can produce the same item.
- Keep recipe craft time: rejected per product decision; we enforce “single craft time per machine” during seeding.

### 2) Canonical “media URL” shape for frontend

- Runtime UI will use `item.image.url` / `machine.image.url` (via Payload media relationship).
- `media.sourcePath` remains the stable dedupe key for seed imports.
- `src/data/db.json` is treated as seed input (and may omit legacy image path fields entirely).

**Rationale:** avoids leaking build-time filesystem paths into runtime data models.

### 3) Seed workflow supports reset + rebuild

- Add an explicit reset mode (e.g., `pnpm seed --reset`):
  - Delete order: `recipes` → `machines` → `items` → optional `media`
  - Rebuild order: `media` (optional) → `items` → `machines` → `recipes`
- Seed will validate invariants:
  - `machines.craftTime` is derived from associated recipes and must be consistent per machine. If inconsistent, seed logs a warning and proceeds with a deterministic choice.
  - Category documents are created/upserted and items/machines link to categories via relationships when available (otherwise category is empty).

**Rationale:** predictable rebuilds remove “mystery state” and speed up development/testing.

**Alternative considered:**

- Partial reset (only upsert): kept as the default path, but insufficient for schema migrations and fast iteration.

## Sequence diagrams

### Seed reset + rebuild flow

```text
Developer         seed.ts                 Payload (Local API)          Postgres
   |                |                           |                        |
   | pnpm seed --reset                          |                        |
   |--------------->| delete recipes            |                        |
   |                |-------------------------->| deleteMany(recipes)    |
   |                |                           |----------------------->|
   |                | delete machines/items     |                        |
   |                |-------------------------->| deleteMany(machines)   |
   |                |-------------------------->| deleteMany(items)      |
   |                | optional delete media     |                        |
   |                |-------------------------->| deleteMany(media)      |
   |                | upsert media/items/...    |                        |
   |                |-------------------------->| create/update docs     |
   |<---------------| done + summary            |                        |
```

## Risks / Trade-offs

- **[Craft time invariants may be violated in source data] → Mitigation:** validate per-machine craftTime during seed; warn and use a deterministic choice when conflicts exist.
- **[Removing legacy image-path fields breaks existing UI code] → Mitigation:** standardize on media URLs in the server-side data loader and update affected components together with schema changes.
- **[Manual/hub recipes have “0 craft time”] → Mitigation:** treat them as special-cased sources/sinks in UI (non-throughput steps) or map them to a “manual machine” with a defined craft time if required later.

## Migration Plan

1. Update Payload collection schemas (items/machines/recipes) and regenerate types.
2. Update seed script:
   - Support reset mode
   - Upsert `item-categories` / `machine-categories` and link items/machines by relationship (category optional)
   - Derive and store `items.rarity` and optional `items.sortId`
   - Derive and store `machines.rarity`, optional `machines.sortId`, and `machines.craftTime`
   - Remove legacy image-path fields; keep media import via `media.sourcePath`
3. Update server-side data loader (`getAllData`) to emit a stable frontend shape using media URLs.
4. Update existing pages/components (recipe browser, item detail, production chain) to use the new normalized fields.
5. Rollback: revert schema + seed and re-run seed; temporarily enable JSON fallback if needed.

## Open Questions

- Craft time MUST be consistent per machine; if inconsistent input data is encountered, seed SHOULD warn and proceed with a deterministic choice.
- Allow `items.category` to be empty when no category is available in source data.
