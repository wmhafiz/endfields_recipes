## 1. Data Types & Utilities

- [x] 1.1 Create `src/app/(frontend)/types/recipes.ts` with canonical TypeScript interfaces:
  - `Item` (id, name, localImagePath?, category?)
  - `Facility` (id, name, localImagePath?, category, processingTime?, description?)
  - `RecipeInput` ({ item: string, quantity: number })
  - `Recipe` (facility, output, inputs: RecipeInput[], outputQuantity?, notes?)
  - `RecipesData` (totalItems, items, facilities, recipes)
- [x] 1.2 Update `buildProductionChain.ts` to import types from the new file
- [x] 1.3 Remove duplicate interface definitions from `ItemsDisplay.tsx` and `page.tsx`

## 2. Production Chain Updates

- [x] 2.1 Update `buildProductionChain.ts`:
  - Change input iteration from `recipe.inputs` (string[]) to `recipe.inputs` (RecipeInput[])
  - Extract item name via `input.item` instead of `input` directly
  - Pass quantity info through the chain data structure
- [x] 2.2 Update `useProductionChain.ts`:
  - Lookup facility `processingTime` from facilities data (not recipe)
  - Pass quantity to node data for display
- [x] 2.3 Update `ItemNode.tsx` to optionally display quantity badge when quantity > 1
- [x] 2.4 Update `FacilityNode.tsx` to handle missing `processingTime` (don't show "0s")

## 3. Shared Image/Placeholder Component

- [x] 3.1 Create `src/app/(frontend)/components/ImageOrPlaceholder.tsx`:
  - Accept `imagePath`, `alt`, `width`, `height` props
  - If `imagePath` is undefined/empty, render a styled placeholder box with the `alt` text
  - Otherwise render `next/image`
- [x] 3.2 Update `ItemNode.tsx` to use `ImageOrPlaceholder`
- [x] 3.3 Update `FacilityNode.tsx` to use `ImageOrPlaceholder`

## 4. Item Detail Page Updates

- [x] 4.1 Update `items/[id]/page.tsx` recipe lookups:
  - Change "Used In" filter from `r.inputs.includes(item.name)` to `r.inputs.some(i => i.item === item.name)`
- [x] 4.2 Update "Produced By" recipe cards:
  - Display input quantities (e.g., "×10")
  - Display output quantity when `outputQuantity > 1`
  - Display `notes` as subtle muted text when present
  - Source `processingTime` from facility lookup (not recipe)
- [x] 4.3 Update "Used In" recipe cards with same quantity/notes/time changes
- [x] 4.4 Use `ImageOrPlaceholder` for item and facility images in recipe cards
- [x] 4.5 Update `ItemHeader.tsx` to use `ImageOrPlaceholder`

## 5. Items List Category Filtering

- [x] 5.1 Update `ItemsDisplay.tsx`:
  - Derive unique categories from `data.items` (collect all `item.category` values)
  - Add state for selected category filter
  - Add category dropdown/select UI (options: "All", derived categories, "Uncategorized")
- [x] 5.2 Update filtering logic to combine search query AND category filter
- [x] 5.3 Use `ImageOrPlaceholder` for item cards
- [x] 5.4 Update item count display to reflect filtered count

## 6. Facilities Page

- [x] 6.1 Create route `src/app/(frontend)/facilities/page.tsx`:
  - Load `recipes.json`
  - Group/list facilities
  - Derive related recipes per facility (`recipe.facility === facility.name`)
- [x] 6.2 Create `FacilityCard.tsx` component:
  - Display facility image/placeholder, name, category, description, processingTime
  - Display "Recipes" section with outputs and quantified inputs
  - Link outputs/inputs to item detail pages
- [x] 6.3 Add category filter for facilities (Resourcing, Processing, All)
- [x] 6.4 Add styles for facilities page and FacilityCard

## 7. Navigation

- [x] 7.1 Add "Facilities" link to navigation/header (update `layout.tsx` or create shared nav component)
- [x] 7.2 Ensure back navigation from item detail still works

## 8. Styling & Polish

- [x] 8.1 Add CSS for quantity badges (small, muted background)
- [x] 8.2 Add CSS for notes display (muted text, smaller font)
- [x] 8.3 Add CSS for placeholder boxes (consistent sizing, subtle border/background, centered text)
- [x] 8.4 Add CSS for category filter dropdown
- [x] 8.5 Add CSS for facilities page layout and cards

## 9. Testing & Verification

- [x] 9.1 Verify production chain renders with quantities for "Xiranite Component" (10 Xiranite, 10 Packed Origocrust)
- [x] 9.2 Verify facility nodes show time from facility data (Gearing Unit = 10s, Refining Unit = 2s)
- [x] 9.3 Verify items without images show placeholder (e.g., "Wood", "Clean Water")
- [x] 9.4 Verify item detail recipe cards show quantities and notes (Jincao with "Requires Fluid Mode")
- [x] 9.5 Verify items list category filter works with search
- [x] 9.6 Verify `/facilities` page loads and displays all facilities with related recipes
- [x] 9.7 Run `tsc --noEmit` to verify no TypeScript errors
