## Context

The Endfields Recipes app uses a static JSON data source (`src/data/recipes.json`) to render:

- An items list (grid/list) with search
- Dedicated item detail pages (`/items/[id]`) that show “Produced By”, “Used In”, and a React Flow production chain visualization

The `recipes.json` schema has been expanded:

- Facilities now include richer metadata (`category`, `processingTime`, `description`)
- Recipes now include quantified inputs (`{ item, quantity }[]`) and optional fields (`outputQuantity`, `notes`)
- Some properties (e.g. `localImagePath`, `category`) are optional and must be handled without runtime failures

We also want to add a dedicated facilities route that exposes facility metadata and helps users browse what each facility can produce and what it consumes.

## Goals / Non-Goals

**Goals**

- Update frontend TypeScript types and runtime logic to match the updated `recipes.json` schema.
- Show **per-recipe** input quantities in:
  - production chain nodes (inputs)
  - item detail recipe cards
  - facilities recipe listings
- Source facility processing time from `facilities[].processingTime` (not per-recipe) and render it when present.
- Add `/facilities` to browse facilities with category/description/time and related recipes/products.
- Add items category filtering to the items list UI.
- Gracefully handle missing images across the UI with consistent placeholder boxes.

**Non-Goals**

- No cumulative quantity math across the full chain; quantities are displayed as authored per recipe edge.
- No schema migration to switch name-based references to IDs (recipes continue referencing `item` and `facility` by name).
- No new data editing/admin UI; the JSON remains the source of truth.

## Decisions

### 1. Centralize recipe data types

**Decision**: Define a single set of types for `recipes.json` (items, facilities, recipes, inputs) and import them wherever needed (avoid per-component duplicate interfaces).

**Rationale**: The current code duplicates the old schema in multiple files, which is how breaking changes slipped in. A single source reduces drift and makes future schema updates safer.

### 2. Represent quantified inputs explicitly

**Decision**: Treat recipe inputs as `RecipeInput[]`:

```ts
type RecipeInput = { item: string; quantity: number }
```

and propagate the quantity to UI as a display concern (badge/inline text).

**Rationale**: Quantities are now part of the canonical data. Displaying them in both detail pages and the chain is the primary value of the schema update.

### 3. Facility processing time lives on facilities

**Decision**: Facility nodes display `processingTime` looked up by facility name from `facilities[]`. If missing, omit the time display (do not show “0s”).

**Rationale**: Not all facilities have meaningful processing time (e.g., resourcing), and “0s” implies data rather than “unknown / not applicable”.

### 4. Missing-image rendering uses a text placeholder box

**Decision**: When `localImagePath` is absent, render a fixed-size placeholder box with the item/facility name (or short label) instead of `next/image`.

**Rationale**: `next/image` requires a valid `src`. A placeholder prevents runtime errors and keeps layout stable while the dataset is incomplete.

### 5. Items category filtering is client-side and derived from data

**Decision**: In the items list UI, derive the set of categories from `items[].category`, add “All” and “Uncategorized”, and filter client-side in combination with the existing search query.

**Rationale**: Data is static and loaded locally; client-side filtering is simplest and fast enough at current scale.

### 6. Facilities route is list-first with embedded related recipes

**Decision**: Implement `/facilities` as a list/browse page. Each facility card shows:

- facility image/placeholder, name, category
- description and processing time (if present)
- a “Related” section listing recipes that use this facility, showing:
  - outputs produced
  - input items (with quantities) used by those recipes

**Rationale**: This meets the browsing goal without adding multiple new routes. If the page becomes too dense later, we can add `/facilities/[id]` as a follow-up.

## Component Architecture

```
src/app/(frontend)/
├── facilities/
│   └── page.tsx                    # Facilities list/browse page (server)
├── components/
│   ├── ItemsDisplay.tsx            # Category filtering + image fallbacks (client)
│   ├── FacilityCard.tsx            # (new) Facility list card + related recipes (server or client)
│   └── ImageOrPlaceholder.tsx      # (new) shared image/placeholder renderer
├── items/
│   └── [id]/page.tsx               # Update recipe cards for quantities/notes + fallbacks (server)
├── utils/
│   └── buildProductionChain.ts     # Update chain builder for quantified inputs + facility time lookup
└── types/
    └── recipes.ts                  # (new) canonical TS types for recipes.json
```

## Data Flow

### Item detail + production chain

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          SEQUENCE DIAGRAM                               │
├─────────────────────────────────────────────────────────────────────────┤
│ User               Server Component                   Client Component  │
│  │                     │                                   │           │
│  │ GET /items/[id]     │                                   │           │
│  ├────────────────────▶│                                   │           │
│  │                     │ load recipes.json                 │           │
│  │                     │ lookup item by id                 │           │
│  │                     │ compute producedBy / usedIn       │           │
│  │                     │ pass data + itemName              │           │
│  │                     ├──────────────────────────────────▶│           │
│  │                     │                                   │ build     │
│  │                     │                                   │ chain:    │
│  │                     │                                   │ - traverse recipes (quantified inputs)
│  │                     │                                   │ - lookup facility processingTime
│  │                     │                                   │ - render nodes with qty badges
│  │                     │                                   │ - render images or placeholders
│  │◀────────────────────┴───────────────────────────────────┴───────────│
└─────────────────────────────────────────────────────────────────────────┘
```

### Facilities browse page

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          SEQUENCE DIAGRAM                               │
├─────────────────────────────────────────────────────────────────────────┤
│ User               Server Component                                     │
│  │                     │                                                │
│  │ GET /facilities     │                                                │
│  ├────────────────────▶│ load recipes.json                              │
│  │                     │ list facilities (by category)                  │
│  │                     │ for each facility, select recipes where        │
│  │                     │   recipe.facility === facility.name            │
│  │                     │ render facility cards + related recipes         │
│  │◀────────────────────┴────────────────────────────────────────────────│
└─────────────────────────────────────────────────────────────────────────┘
```

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Name-based references break if names change | Keep lookups resilient (fallbacks), consider future schema change to IDs |
| Facilities page becomes long/slow as data grows | Add category filter, collapse related section, consider `/facilities/[id]` later |
| Missing images reduce visual clarity | Placeholder boxes keep layout usable; optionally show category labels to aid scanning |
| Processing time absent for some facilities | Omit time display rather than showing incorrect defaults |

## Open Questions

1. **Facilities related section format**: show all recipes inline vs. aggregate unique inputs/outputs. (Start with per-recipe cards; can add aggregation later.)
2. **Category UI**: chips vs dropdown. (Start with a simple dropdown + “All/Uncategorized”.)

