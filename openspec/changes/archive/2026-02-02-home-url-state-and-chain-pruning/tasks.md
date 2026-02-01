## 1. Install and Configure nuqs

- [x] 1.1 Install `nuqs` package
- [x] 1.2 Add `NuqsAdapter` provider to the app layout

## 2. URL State Parsers

- [x] 2.1 Create `src/app/(frontend)/hooks/useRecipeBrowserParams.ts` with nuqs parsers
- [x] 2.2 Define parsers for all filter/sort/search parameters with appropriate defaults

## 3. Recipe Browser URL Integration

- [x] 3.1 Replace `useState` calls in `RecipeBrowser.tsx` with `useQueryStates` from nuqs
- [x] 3.2 Update `clearFilters` function to reset all URL params to defaults

## 4. Production Chain Recipe Filtering

- [x] 4.1 Add `filterRecipesForChain` function to `buildProductionChain.ts`
- [x] 4.2 Implement manual recipe exclusion (`type !== 'manual'`)
- [x] 4.3 Implement recipe scoring function based on raw material ingredient count
- [x] 4.4 Update `findRecipesForOutputById` to use filtering and return sorted results

## 5. Production Chain Integration

- [x] 5.1 Update `buildProductionChain` to apply recipe filtering when selecting default recipes
- [x] 5.2 Ensure user-selected recipes (via `selectedRecipes` map) override automatic selection
- [x] 5.3 Handle edge case: item with only manual recipe displays as terminal node

## 6. Testing & Validation

- [x] 6.1 Test URL state persistence: apply filters, navigate away, navigate back
- [x] 6.2 Test URL sharing: copy URL with filters, open in new tab
- [x] 6.3 Test production chain: verify manual recipes are excluded
- [x] 6.4 Test production chain: verify ore-based paths are preferred over intermediate paths
- [x] 6.5 Test recipe override: manually select alternative recipe, verify chain updates
