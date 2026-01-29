## 1. Planner route + shell

- [x] 1.1 Add planner route (e.g. `src/app/(frontend)/planner/page.tsx`) that loads `EnrichedDbData` via `getAllData()` and renders a client planner root component
- [x] 1.2 Add navigation entry to reach the planner (keep existing pages working)
- [x] 1.3 Implement the three-pane layout shell (left sidebar, canvas, right panel) with responsive sizing and a clear empty-state

## 2. Item sidebar (search + collapse + drag)

- [x] 2.1 Implement item sidebar list rendering from `data.items` with basic search filtering
- [x] 2.2 Add collapse/expand behavior for the sidebar and persist collapse state within the session (in-memory)
- [x] 2.3 Implement drag source behavior for items (dataTransfer payload includes `itemId`)

## 3. Inspector panel (item details + producing recipes)

- [x] 3.1 Implement “inspect item” selection from sidebar and from canvas node selection
- [x] 3.2 Render item details (name, image, raw/crafted status, category if present)
- [x] 3.3 List producing recipes for the inspected item (match `recipe.outputs[*].itemId`)
- [x] 3.4 Add recipe filters: “uses raw materials” and “has ingredient X”

## 4. Selected targets panel (plan inputs)

- [x] 4.1 Add “Add to plan” action from a recipe row to create a target entry (item + recipe)
- [x] 4.2 Implement target list management (edit qty/min, remove target, clear all)
- [x] 4.3 Add planner settings UI: ratio/multi-line mode, max depth, and build action
- [x] 4.4 Show pre-build summary stats (total configured target output per minute)

## 5. Compute engine: plan → requirements → machine counts

- [x] 5.1 Define planner types (`PlanTarget`, `PlannerSettings`, `ComputedPlan`, stats types) in a dedicated module
- [x] 5.2 Implement requirement propagation (needed/min) across the dependency graph using selected recipes and output counts (handle multi-output recipes by matching the target output entry)
- [x] 5.3 Compute machine counts and yields/min from craft time (gracefully handle missing/zero craft time as “unknown throughput”)
- [x] 5.4 Implement ratio/multi-line mode strategy (fractional vs whole-number scaling/rounding) and expose the chosen scale factor in computed stats

## 6. Graph building + React Flow rendering

- [x] 6.1 Convert computed plan into stable React Flow nodes/edges keyed by `itemId` and `recipe.id` (aggregate shared dependencies)
- [x] 6.2 Render the computed graph on the canvas with existing `ItemNode`/`FacilityNode` styling (or planner variants) and fit-view behavior
- [x] 6.3 Implement node selection → inspector synchronization (select node updates inspector without leaving planner)

## 7. Drag-drop to add targets

- [x] 7.1 Implement canvas drop target behavior: dropping an item adds it as a target (requires recipe selection if multiple producing recipes exist)
- [x] 7.2 Define default behavior for items with multiple producing recipes (prompt in inspector or choose first recipe as default)

## 8. Layout switching

- [x] 8.1 Add layout selector (horizontal/vertical) available after a graph is built
- [x] 8.2 Implement Dagre layout switching via `rankdir` and reapply positions without mutating plan requirements

## 9. Yield vs needed + bottlenecks

- [x] 9.1 Add per-node overlays for needed/min and yield/min (or “unknown” when not computable)
- [x] 9.2 Implement bottleneck detection (yield < needed) and visual highlighting for bottleneck nodes/edges
- [x] 9.3 Add a “focus bottleneck” action (zoom to highlighted node(s))

## 10. UX polish + verification

- [x] 10.1 Improve planner empty-states and inline guidance (what to do next)
- [x] 10.2 Add keyboard/accessibility basics (focus-visible, aria labels for collapse/build/layout controls)
- [x] 10.3 Add unit tests for the compute engine (requirement propagation and scaling modes)
- [x] 10.4 Run `pnpm lint` and `pnpm test:int` and fix any introduced issues
