## 1. Setup & Dependencies

- [x] 1.1 Install React Flow and Dagre dependencies (`@xyflow/react`, `dagre`, `@types/dagre`)
- [x] 1.2 Update `recipes.json` to add `processingTime` field to all recipes with placeholder values

## 2. Data Layer & Utilities

- [x] 2.1 Create `buildProductionChain.ts` utility function with recursive backward traversal
- [x] 2.2 Implement cycle detection using visited set to prevent infinite loops
- [x] 2.3 Add depth limiting parameter to chain building function
- [x] 2.4 Create helper to find all recipes for a given output (for multiple recipe handling)

## 3. Custom React Flow Nodes

- [x] 3.1 Create `ItemNode.tsx` component displaying item image, name, and collapse/expand control
- [x] 3.2 Add raw material indicator styling to ItemNode for terminal nodes
- [x] 3.3 Add collapsed state badge showing hidden descendant count (e.g., "+3")
- [x] 3.4 Create `FacilityNode.tsx` component displaying facility image, name, and processing time

## 4. Production Chain Component

- [x] 4.1 Create `ProductionChain/index.tsx` as main React Flow wrapper (client component)
- [x] 4.2 Create `useProductionChain.ts` hook to build nodes and edges from recipe data
- [x] 4.3 Implement Dagre layout with horizontal LTR orientation (`rankdir: 'LR'`)
- [x] 4.4 Wire up pan and zoom functionality (built into React Flow)
- [x] 4.5 Implement node click handler to navigate to item detail page via `router.push()`

## 5. Chain Controls

- [x] 5.1 Create `ChainControls.tsx` component with depth limit input
- [x] 5.2 Add recipe selector dropdown for items with multiple recipes
- [x] 5.3 Connect controls to production chain state (re-render graph on change)

## 6. Collapse/Expand Functionality

- [x] 6.1 Add collapse/expand state management to ProductionChain component
- [x] 6.2 Implement toggle handler on ItemNode collapse button
- [x] 6.3 Filter nodes/edges based on collapsed state before rendering
- [x] 6.4 Calculate and display hidden node count on collapsed nodes

## 7. Item Detail Page

- [x] 7.1 Create route structure `src/app/(frontend)/items/[id]/page.tsx`
- [x] 7.2 Implement server component to load item by ID from `recipes.json`
- [x] 7.3 Add 404 handling for invalid item IDs using `notFound()`
- [x] 7.4 Create `ItemHeader.tsx` component for item image and name display
- [x] 7.5 Add back navigation link to items list

## 8. Item Detail Page Sections

- [x] 8.1 Add Production Chain section with React Flow visualization
- [x] 8.2 Add "Produced By" section showing direct recipe (inputs → facility → output)
- [x] 8.3 Add "Used In" section listing recipes where item is an input
- [x] 8.4 Handle raw material case (no production chain, just indicator)

## 9. Update Items List

- [x] 9.1 Modify `ItemsDisplay.tsx` to use Next.js `Link` instead of modal onClick
- [x] 9.2 Remove modal-related code (selectedItem state, modal JSX, backdrop)
- [x] 9.3 Update item card to be wrapped in Link to `/items/[id]`

## 10. Styling

- [x] 10.1 Add CSS for item detail page layout
- [x] 10.2 Style custom ItemNode to match game aesthetic (dark theme, rounded corners)
- [x] 10.3 Style custom FacilityNode with processing time badge
- [x] 10.4 Style ChainControls (depth input, recipe selector)
- [x] 10.5 Add React Flow container styling (background, borders)
- [x] 10.6 Remove unused modal styles from `styles.css`

## 11. Testing & Verification

- [x] 11.1 Verify production chain renders correctly for Industrial Explosive (multi-level)
- [x] 11.2 Verify raw material items show single node with no dependencies
- [x] 11.3 Test collapse/expand functionality shows correct hidden count
- [x] 11.4 Test depth limit control filters nodes correctly
- [x] 11.5 Test multiple recipe selector for Originium Powder
- [x] 11.6 Test node click navigation works correctly
- [x] 11.7 Test 404 page for invalid item IDs
