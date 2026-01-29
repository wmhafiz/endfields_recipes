## Context

The current frontend UX is centered around a recipe browser (home page) and an item detail page (`/items/[slug]`) that renders a single-item production chain using React Flow (`@xyflow/react`) + Dagre layout. Users now want a **canvas-first production planning experience** where they can:

- Browse items in a left sidebar (search/filter).
- Inspect an item and its producing recipes on the right.
- Select one or more target recipes, configure output rates (qty/min), and apply generation settings.
- Generate a combined production-chain graph, then iterate with layout controls and bottleneck feedback.

Constraints / realities in the current codebase:

- Next.js 15 App Router; React Flow rendering must remain a client component.
- Data is available as `EnrichedDbData` (items + recipes) and can be loaded server-side via `getAllData()` and passed into client components.
- Existing production chain visualization uses item nodes + facility nodes, left-to-right Dagre layout, and supports collapse/expand and recipe variants for a single target.
- The repo currently uses global CSS (`src/app/(frontend)/styles.css`), not Tailwind/shadcn.

## Goals / Non-Goals

**Goals:**

- Add a new planner route (e.g. `/planner`) with a three-pane layout: item sidebar → canvas → inspector/selected targets.
- Provide a plan configuration model that supports:
  - One or more targets (item + recipe + qty/min).
  - A generation mode to avoid fractional machine counts (multi-line / scaled ratios).
  - Post-generation layout toggles (horizontal/vertical).
- Compute and display:
  - Required rates for inputs and intermediates (needed/min).
  - Produced rates (yield/min) based on machine craft time and chosen machine counts.
  - Bottlenecks where yield < needed.
- Ensure a strong React Flow UX: selection, pan/zoom, node clarity, and fast recalculation.

**Non-Goals:**

- Persisting plans (accounts, saving, sharing) in v1.
- Editing the underlying recipe database from the planner.
- Mobile-first gestures; desktop-first is acceptable.

## Decisions

### 1) Planner as an additive route

**Decision:** Implement the planner as a new route (e.g. `/planner`) and keep existing pages working during rollout.

**Alternatives considered:**

- Replace the home page entirely: aligns with “revamp” but higher rollout risk.
- Embed planner into item detail: insufficient space, conflates “view” vs “plan”.

**Rationale:** Additive route enables iteration and a clean rollback (remove the route + nav entry).

### 2) Reuse React Flow + existing node UI

**Decision:** Use `@xyflow/react` for the planner canvas and reuse the existing item/facility node visual language where possible.

**Alternatives considered:**

- Custom SVG/canvas: high effort for selection/pan/zoom.
- D3-only: excellent flexibility but more bespoke interaction work.

**Rationale:** React Flow already exists in the repo, matches the desired UX, and keeps interaction costs low.

### 3) Separate “plan state” from “computed graph”

**Decision:** Introduce an explicit state model:

- **Plan inputs**: selected targets + settings.
- **Derived outputs**: computed rates, machine counts, and React Flow nodes/edges.

**Rationale:** Prevents accidental recomputation loops and makes “Apply settings then build” a first-class interaction.

Proposed core shapes:

- `PlanTarget = { itemId, recipeId, qtyPerMin }`
- `PlannerSettings = { ratioMode, layout, maxDepth }`
- `ComputedPlan = { nodes, edges, stats }`

### 4) Multi-target chain computation with aggregation

**Decision:** Compute requirements by aggregating across targets and building a combined dependency graph keyed by canonical identifiers.

**Key implications:**

- Item identity is `itemId` (already used in the existing chain builder).
- Facility nodes should be keyed to the specific crafting step (recommend: `recipe.id`, not only `machineId`, because different recipes can share machines).
- When multiple targets require the same intermediate item, requirements are summed (needed/min accumulates).

**Alternatives considered:**

- Generate one chain per target and render separately: avoids aggregation complexity but makes shared dependencies unreadable and prevents meaningful totals.

### 5) Layout switching via Dagre rank direction

**Decision:** Keep Dagre for automatic layout and change orientation via `rankdir` (LR vs TB) as the primary layout switch.

**Alternatives considered:**

- ELK: more features, larger dependency and tuning surface.
- Manual layout: not feasible for variable-depth graphs.

**Rationale:** Dagre is already in use and sufficient for the directed dependency structure.

## Key Flows (Sequence Diagrams)

### Flow: Configure → Build → Render

```
User                 Planner UI (client)                Compute engine
 |                            |                              |
 | click item in sidebar      |                              |
 |--------------------------->| set inspectedItemId          |
 |                            | render inspector + recipes   |
 | select recipe + qty/min    |                              |
 |--------------------------->| update plan.targets          |
 |                            |                              |
 | click "Build production"   |                              |
 |--------------------------->| freeze inputs + settings     |
 |                            |----------------------------->| compute requirements graph
 |                            |                              | compute machine counts
 |                            |                              | build nodes/edges (+ stats)
 |                            |<-----------------------------| ComputedPlan
 |                            | setComputedPlan              |
 |                            | render ReactFlow             |
 |                            | show stats + bottlenecks     |
```

### Flow: Post-generation layout change

```
User                 Planner UI (client)                Layout engine (Dagre)
 |                            |                              |
 | select "Vertical" layout   |                              |
 |--------------------------->| update settings.layout        |
 |                            |----------------------------->| re-run layout positions
 |                            |<-----------------------------| positioned nodes
 |                            | update ReactFlow nodes        |
```

## Computation Approach

### Requirements propagation (needed/min)

For each target item:

1. Determine the selected producing recipe.
2. Compute crafts/min for that item using the recipe’s output count for the target item (multi-output recipes must use the matching output entry).
3. Add ingredient requirements: `needed[ingredientId] += craftsPerMin * ingredientCount`.
4. Recurse until raw materials or depth limit.

### Machine counts and yield/min

For each crafting step:

- `craftsPerMin` is known from requirements propagation.
- `machinesExact = craftsPerMin * (craftTimeMs / 60000)`.
- `yieldPerMin = machineCount * (60000 / craftTimeMs) * outputCountForThisItem`.

Ratio mode:

- **Fractional mode**: allow `machineCount = machinesExact`.
- **Whole-number / multi-line mode**: scale the plan by an integer factor so machine counts are whole numbers (or, as a fallback, round up). The chosen strategy should be explicit in the UI so users understand whether results are exact or approximated.

### Bottleneck identification

- For each item node, compute `neededPerMin` and `yieldPerMin` (when craft time is available).
- A bottleneck exists when `yieldPerMin < neededPerMin` (or when a rounded strategy intentionally allows underproduction).

## UI Architecture (proposed)

- `src/app/(frontend)/planner/page.tsx` (server):
  - loads `EnrichedDbData` via `getAllData()`
  - renders a client `ProductionPlanner` component with `data` as props
- `src/app/(frontend)/components/ProductionPlanner/*` (client):
  - `ItemSidebar` (search/filter + draggable items)
  - `InspectorPanel` (item details + recipe list + filters)
  - `SelectedTargetsPanel` (targets + qty/min + settings + build button + summary stats)
  - `PlannerCanvas` (ReactFlow rendering + layout + overlays)

## Risks / Trade-offs

- **Large graphs may be slow** → default depth limit, memoized computation, avoid re-layout on every keystroke (explicit “Build” action).
- **Multi-output recipes ambiguity** → define v1 policy (primary-output-only vs include byproducts) and reflect it in UI/notes.
- **Missing/zero craft time** → show “unknown throughput” and suppress bottleneck math for affected steps.
- **Disconnected graphs (multiple targets)** → add a synthetic super-root for layout or lay out each component and offset them.

## Migration Plan

- Add the planner route and link it from navigation.
- Ship with conservative defaults (fractional mode, horizontal layout).
- Rollback: remove/disable the planner route + nav link; no data migrations are required.

## Open Questions

- How should multi-output recipes be handled in planning (ignore byproducts, show as secondary yields, or require explicit selection)?
- What is the exact user-facing definition of “multi-line ratio mode” (LCM scaling vs rounding strategy, and do we expose the scale factor)?
- Should plans be shareable (URL-encoded state) as a follow-up to improve iteration and collaboration?
