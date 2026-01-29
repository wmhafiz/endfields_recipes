## Why

The current UI is optimized for browsing recipes and viewing a single item’s dependency chain, but it does not support planning a full production line with multiple targets, rate goals (per minute), and clear bottleneck feedback. A canvas-first planner will make it faster to explore “what do I need to build to produce X/min?” and iterate on recipe choices and ratios.

## Goals

- Provide a **canvas-like production planner** where users can drag/drop items, choose recipes, set output rates, and generate a production chain graph.
- Let users configure generation behavior (e.g. multi-line / integer-ratio options) before building the graph.
- Show **throughput statistics** (produced vs needed per minute) and highlight bottlenecks after generation.
- Ensure a high-quality React Flow UX (selection, pan/zoom, node interaction clarity, minimal clutter).

## Non-goals

- Persisting plans across sessions or accounts (export/save can be a follow-up).
- Editing recipe data in the UI.
- Mobile-first interaction design (desktop-first; basic mobile support is acceptable).
- Perfect simulation accuracy where source data is missing or ambiguous (e.g., multi-output byproducts in v1 may be simplified).

## What Changes

- Add a new **Production Planner** page (e.g. `/planner`) featuring:
  - Left collapsible sidebar listing items with search and filters.
  - Right-side inspector/sheet for item details + available recipes, including recipe filtering.
  - A “Selected Recipes / Targets” panel with per-item output rate (qty/min) and generation settings.
  - A “Build production line” action that generates a React Flow graph.
- After generation:
  - Layout configuration (horizontal/vertical orientations).
  - Yield vs needed visualization and bottleneck highlighting.
- Keep existing browsing and item detail pages working during rollout (planner is additive in the first iteration).

## Capabilities

### New Capabilities

- `production-planner`: Canvas-first UX to build a multi-target production plan, configure output rates and generation settings, generate a production chain graph, and surface throughput/bottleneck insights.

### Modified Capabilities

- (none)

## Impact

- **Frontend routes/components**: new planner route and UI components; reuse existing `@xyflow/react` graph patterns and the current production-chain utilities where practical.
- **Computation layer**: add a plan-to-graph calculation step to support qty/min targets, throughput stats, and bottleneck detection.
- **Data**: no schema changes required; uses existing item/recipe data shapes.

## Rollback Plan

- Ship the planner as an additive route and nav entry first.
- If issues arise, remove/disable the planner route and navigation link; existing recipe browsing and item detail pages remain unchanged.
