## Context

The recipe browser (`RecipeBrowser.tsx`) currently stores all filter, search, and sort state in React `useState` hooks. This means:
- State is lost on navigation away and back
- URLs cannot be shared with specific filter configurations
- Browser back/forward navigation doesn't restore filter state

The production chain builder (`buildProductionChain.ts`) currently includes all recipe variants when building chains:
- Manual crafting recipes clutter the chain with hand-crafting options
- Chains can start from intermediate items (powders, processed materials) instead of tracing back to raw ores
- This results in complex, less useful visualizations

## Goals / Non-Goals

**Goals:**
- Sync recipe browser filters/search/sort to URL query parameters
- Persist state across navigation without localStorage
- Filter production chains to exclude manual crafting
- Prefer ore-based production paths over intermediate-starting chains

**Non-Goals:**
- Server-side filtering (all filtering remains client-side)
- Changing the UI/UX design of filters
- Adding pagination or infinite scroll
- Modifying production chain layout algorithm

## Decisions

### Decision 1: URL State Management Approach

**Choice**: Use `nuqs` library for type-safe URL state management

**Alternatives considered**:
1. Next.js `useSearchParams` + `useRouter` directly - More boilerplate, manual type handling
2. Custom hook wrapping `URLSearchParams` - Reinventing the wheel
3. Next.js shallow routing with state - Less type-safe, more manual work

**Rationale**: `nuqs` provides type-safe URL state management specifically designed for Next.js App Router. It handles serialization/parsing, default values, and URL updates automatically with minimal boilerplate. The small dependency (~5KB) is worth the cleaner code and built-in type safety. Using `nuqs` parsers ensures consistent URL formatting and type coercion.

### Decision 2: URL Parameter Schema

**Choice**: Use short, readable parameter names

```
?q=search          // search query
&type=machine      // recipe type filter
&cat=AIC+Products  // category filter
&machine=Refiner   // machine filter
&rarity=4          // rarity filter
&raw=yes           // uses raw material filter (yes/no/omit for any)
&sort=name         // sort field
&dir=asc           // sort direction
&view=grid         // view mode
```

**Rationale**: Short names reduce URL length. Values are human-readable. Omitted params use defaults.

### Decision 3: Production Chain Recipe Filtering

**Choice**: Add a `recipeFilter` function to `buildProductionChain` that:
1. Excludes recipes with `type: 'manual'`
2. Scores remaining recipes by "distance to ore" - prefer recipes whose ingredients are closer to raw materials

**Implementation approach**:
```
filterRecipes(recipes: EnrichedRecipe[], data: EnrichedDbData): EnrichedRecipe[]
  → Filter out type === 'manual'
  → Score remaining by ingredient rawness (prefer ingredients that are raw or have shorter chains)
  → Return sorted array (best first)
```

**Rationale**: Rather than complex ore-detection, we prefer recipes whose direct ingredients include raw materials or have shorter production chains. This naturally selects ore-based paths.

### Decision 4: Recipe Scoring for Ore Preference

**Choice**: Score recipes by counting raw material inputs + depth penalty for intermediate inputs

```typescript
function scoreRecipe(recipe: EnrichedRecipe, itemsById: Map<string, EnrichedItem>): number {
  let score = 0
  for (const ingredient of recipe.ingredients) {
    const item = itemsById.get(ingredient.itemId)
    if (item?.isRawMaterial) {
      score += 10  // Strongly prefer raw materials
    } else {
      score -= 1   // Penalty for intermediate items
    }
  }
  return score
}
```

**Rationale**: Simple heuristic that prefers recipes using raw materials directly. Higher score = better recipe.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| URL becomes long with many filters | Use short param names; most filters default to "All" so won't appear in URL |
| Browser history cluttered with filter changes | Use `router.replace()` instead of `router.push()` for filter updates |
| Recipe scoring may not always select intuitive path | Users can still manually select alternative recipes via existing recipe selector UI |
| Performance of scoring during chain build | Scoring is O(ingredients) per recipe, negligible for typical recipe counts |

## Sequence: Filter State Sync (with nuqs)

```
User changes filter
       │
       ▼
┌─────────────────┐
│ setFilterState  │──────► nuqs automatically
│ (nuqs hook)     │        updates URL
└─────────────────┘
```

```
Page loads with URL params
         │
         ▼
┌─────────────────┐
│ nuqs parsers    │──────► Type-safe parsing
│ read URL        │        with defaults
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Component       │
│ receives state  │
└─────────────────┘
```

## Implementation: nuqs Parser Definitions

```typescript
// Define parsers with defaults in a shared file
import { parseAsString, parseAsStringLiteral, parseAsInteger } from 'nuqs'

export const searchParamParsers = {
  q: parseAsString.withDefault(''),
  type: parseAsStringLiteral(['all', 'machine', 'manual'] as const).withDefault('all'),
  cat: parseAsString.withDefault('all'),
  machine: parseAsString.withDefault('all'),
  rarity: parseAsInteger.withDefault(0), // 0 = all
  raw: parseAsStringLiteral(['yes', 'no', 'all'] as const).withDefault('all'),
  sort: parseAsStringLiteral(['default', 'name', 'craftTime', 'rarity'] as const).withDefault('default'),
  dir: parseAsStringLiteral(['asc', 'desc'] as const).withDefault('asc'),
  view: parseAsStringLiteral(['grid', 'list'] as const).withDefault('grid'),
}
```
