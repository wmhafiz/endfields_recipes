## Why

Users lose their filter, search, and sort settings when navigating away from the recipe browser and returning. Additionally, production chains display too many variants, including manual crafting options and chains that start from intermediate items (like powder) instead of raw ores, making the visualization cluttered and less useful.

## Goals

- Enable shareable/bookmarkable filtered views of the recipe browser
- Preserve user filter state across navigation
- Simplify production chains by reducing irrelevant variants

## Non-goals

- Persisting state to localStorage or cookies
- Adding new filter options
- Changing the visual design of the production chain

## What Changes

1. **Recipe browser URL state synchronization**
   - Sync all filter, search, and sort state to URL query parameters
   - Read initial state from URL on page load
   - Update URL as user changes filters (without page reload)

2. **Production chain variant pruning**
   - Exclude manual crafting recipes from chain building
   - Prefer recipes that trace back to ore/raw materials over those using intermediate items directly

## Capabilities

### New Capabilities

- `url-state-sync`: Synchronize UI filter/search/sort state with URL query parameters for the recipe browser

### Modified Capabilities

- `production-chain`: Add filtering logic to exclude manual crafting and prefer ore-based production paths

## Impact

- **Files affected**:
  - `src/app/(frontend)/components/RecipeBrowser.tsx` – replace useState with URL-synced state
  - `src/app/(frontend)/utils/buildProductionChain.ts` – add recipe filtering logic
  - `src/app/(frontend)/components/ProductionChain/useProductionChain.ts` – pass filtering options

- **Dependencies**: Add `nuqs` library for type-safe URL state management

- **APIs**: No backend changes required

## Rollback Plan

1. Revert `RecipeBrowser.tsx` to use local `useState` instead of URL params
2. Remove recipe filtering logic from `buildProductionChain.ts`
3. Remove any added dependencies (e.g., `nuqs`)
