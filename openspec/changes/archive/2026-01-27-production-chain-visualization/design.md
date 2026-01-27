## Context

The Endfields Recipes app displays game items with their crafting recipes. Currently, clicking an item opens a modal showing only direct recipe relationships (inputs → facility → output). Users want to see the complete production chain - the full dependency tree from raw materials to final product - similar to the in-game visualization.

The app uses Next.js 15 with App Router, React 19, and a static JSON data source (`recipes.json`). The current modal implementation lives in `ItemsDisplay.tsx` as a client component.

## Goals / Non-Goals

**Goals:**
- Visualize complete production chains with all ancestor dependencies
- Match the game's horizontal left-to-right flow aesthetic
- Support interactive exploration (click to navigate, pan/zoom, collapse/expand)
- Allow users to control depth and select between alternate recipes
- Maintain performance with potentially deep/wide graphs

**Non-Goals:**
- Real-time data updates (static JSON is sufficient)
- Editing recipes from the visualization
- Mobile-optimized touch gestures (desktop-first, basic mobile support only)
- Persisting user preferences (depth limits, selected recipes)

## Decisions

### 1. React Flow for Visualization

**Decision**: Use `@xyflow/react` for the production chain graph.

**Alternatives considered**:
- D3.js: More flexible but requires significant custom code for node interactions
- Vis.js: Less React-native, heavier bundle
- Custom SVG: Maximum control but high development effort

**Rationale**: React Flow provides built-in pan/zoom, custom React nodes, edge routing, and excellent TypeScript support. It's designed for exactly this use case.

### 2. Dagre for Auto-Layout

**Decision**: Use `dagre` library for automatic horizontal graph layout.

**Alternatives considered**:
- ELKjs: More sophisticated but heavier, overkill for tree structures
- Manual positioning: Tedious and error-prone for variable-depth trees

**Rationale**: Dagre handles directed acyclic graphs well, supports horizontal orientation (`rankdir: 'LR'`), and integrates cleanly with React Flow.

### 3. Graph Structure: Items as Primary Nodes

**Decision**: Model the graph with items as primary nodes and facilities as intermediate nodes between them.

```
[Raw Material] → [Facility] → [Intermediate] → [Facility] → [Final Product]
     ●              ⚙              ●              ⚙              ●
```

**Rationale**: This matches the game UI exactly. Facilities show processing time and act as transformation steps between items.

### 4. Chain Building Algorithm

**Decision**: Recursive backward traversal from target item, with cycle detection and memoization.

```
buildChain(itemName, visited, depth):
  if visited.has(itemName) or depth > maxDepth: return null
  visited.add(itemName)
  
  recipe = findRecipeForOutput(itemName)
  if !recipe: return { type: 'raw', item: itemName }
  
  inputChains = recipe.inputs.map(input => buildChain(input, visited, depth + 1))
  return { type: 'item', item: itemName, recipe, inputs: inputChains }
```

**Rationale**: Backward traversal naturally builds the dependency tree. Cycle detection prevents infinite loops if data has circular references.

### 5. Multiple Recipe Handling

**Decision**: When an item has multiple recipes, show a selector UI above the graph. Default to first recipe, let user switch.

**Alternatives considered**:
- Show all paths simultaneously: Too cluttered for complex items
- Modal selection before showing graph: Interrupts flow

**Rationale**: Selector stays visible, user can compare paths by switching. Graph re-renders on selection change.

### 6. Collapse/Expand Behavior

**Decision**: Collapsible at the item node level. Collapsed nodes show a badge indicating hidden descendants.

```
┌─────────────┐
│ Amethyst    │
│ Part   [+3] │  ← "+3" indicates 3 hidden nodes in subtree
└─────────────┘
```

**Rationale**: Lets users focus on specific branches without losing context. Badge prevents confusion about whether dependencies exist.

### 7. Full Page Route vs Modal

**Decision**: Replace modal with dedicated route `/items/[id]`.

**Alternatives considered**:
- Keep modal, add "Full Chain" button: Two interaction patterns, confusing
- Slide-over panel: Limited space for graph

**Rationale**: Full page provides space for the graph, supports browser navigation (back button), enables direct linking to item pages.

## Component Architecture

```
src/app/(frontend)/
├── items/
│   └── [id]/
│       └── page.tsx              # Item detail page (server component)
├── components/
│   ├── ItemsDisplay.tsx          # Updated: Link instead of modal
│   ├── ProductionChain/
│   │   ├── index.tsx             # Main React Flow wrapper (client)
│   │   ├── ItemNode.tsx          # Custom node for items
│   │   ├── FacilityNode.tsx      # Custom node for facilities
│   │   ├── ChainControls.tsx     # Depth limit, recipe selector
│   │   └── useProductionChain.ts # Hook: builds nodes/edges from data
│   └── ItemHeader.tsx            # Item image + name display
└── utils/
    └── buildProductionChain.ts   # Pure function: item → chain tree
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        SEQUENCE DIAGRAM                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  User clicks item     Server Component        Client Component      │
│        │                    │                       │               │
│        │  GET /items/[id]   │                       │               │
│        │───────────────────▶│                       │               │
│        │                    │                       │               │
│        │                    │  Load recipes.json    │               │
│        │                    │  Find item by ID      │               │
│        │                    │  Pass data as props   │               │
│        │                    │──────────────────────▶│               │
│        │                    │                       │               │
│        │                    │                       │ buildChain()  │
│        │                    │                       │ dagre layout  │
│        │                    │                       │ render graph  │
│        │                    │                       │               │
│        │◀───────────────────────────────────────────│               │
│        │  Interactive graph with pan/zoom           │               │
│                                                                     │
│  User clicks node           │                       │               │
│        │                    │                       │               │
│        │  router.push()     │                       │               │
│        │───────────────────▶│ (Next.js navigation)  │               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Deep chains cause performance issues | Default depth limit (10), lazy rendering for off-screen nodes |
| Bundle size increase from React Flow | Tree-shake unused features, measure impact |
| Complex graphs become unreadable | Collapse/expand, zoom controls, depth limiting |
| Circular recipe references in data | Cycle detection in algorithm, visited set |
| Mobile usability with pan/zoom | Basic touch support from React Flow, not optimized |

## Open Questions

1. **Should collapsed state persist across navigation?** Currently no - each page load starts expanded. Could add URL params or localStorage if users want this.

2. **Animation on expand/collapse?** React Flow supports transitions but adds complexity. Start without, add if requested.

3. **Processing time accuracy?** Using placeholder values. Need real game data eventually.
