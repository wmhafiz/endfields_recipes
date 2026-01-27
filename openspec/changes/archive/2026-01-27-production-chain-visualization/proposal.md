## Why

The current item detail modal only shows one level of recipe (immediate inputs → facility → output). Users cannot see the full production chain - for example, viewing Industrial Explosive doesn't reveal that Amethyst Part requires Amethyst Fiber, which in turn requires Amethyst Ore. This makes it difficult to plan resource gathering and production workflows. A visual production chain (like the in-game view) would let users understand the complete dependency tree at a glance.

## What Changes

- **Replace item detail modal with full route** (`/items/[id]`) for richer item detail pages
- **Add React Flow visualization** showing complete production chains with horizontal left-to-right layout matching the game UI
- **Add interactive features**: click nodes to navigate, pan/zoom the graph, collapse/expand branches
- **Add chain controls**: depth limit slider, recipe selector when multiple production paths exist
- **Update recipe data schema** to include `processingTime` for facilities (with placeholder values)
- **Update item grid/list** to use Next.js Link navigation instead of modal popups

## Capabilities

### New Capabilities

- `production-chain`: Interactive React Flow visualization showing full production dependency tree for any item, with horizontal LTR layout, custom item/facility nodes, and edge connections
- `item-detail-page`: Dedicated route (`/items/[id]`) for viewing item details including production chain, replacing the current modal approach

### Modified Capabilities

<!-- No existing specs to modify - this is a new feature -->

## Impact

- **New dependency**: `@xyflow/react` (React Flow library)
- **New dependency**: `dagre` (for automatic graph layout)
- **Data schema**: `recipes.json` gains `processingTime` field on recipes
- **Routing**: New dynamic route at `src/app/(frontend)/items/[id]/page.tsx`
- **Components**: New `ProductionChain.tsx`, `ItemNode.tsx`, `FacilityNode.tsx`, `ChainControls.tsx`
- **Existing component**: `ItemsDisplay.tsx` modified to use Link instead of modal
- **Styles**: New CSS for React Flow nodes and item detail page
