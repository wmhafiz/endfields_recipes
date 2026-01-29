/**
 * Canonical TypeScript interfaces for recipe data
 * Import these types rather than defining duplicates in components
 */

// =============================================================================
// Enriched db.json types (new canonical source)
// =============================================================================

/**
 * Recipe type indicating where/how the item is crafted
 */
export type RecipeType = 'manual' | 'machine' | 'hub'

/**
 * An item in the enriched database
 */
export interface EnrichedItem {
  itemId: string
  itemName: string
  slug: string
  imageUrl?: string
  isRawMaterial: boolean
  category?: string
  rarity?: number
  sortId?: number
}

/**
 * An ingredient in a recipe (enriched with slug)
 */
export interface EnrichedIngredient {
  itemId: string
  itemName: string
  count: number
  slug: string
}

/**
 * An output from a recipe (enriched with slug)
 */
export interface EnrichedOutput {
  itemId: string
  itemName: string
  count: number
  slug: string
}

/**
 * A recipe in the enriched database
 *
 * Note: category and craftTime have been moved to items and machines respectively.
 * - category: Use outputItem.category for filtering/grouping
 * - craftTime: Use machine.craftTime for throughput calculations
 */
export interface EnrichedRecipe {
  id: string
  name: string
  description: string
  type: RecipeType
  machineId: string
  machineName: string
  machineImageUrl?: string
  machineCraftTime: number
  ingredients: EnrichedIngredient[]
  outputs: EnrichedOutput[]
  rarity: string
  defaultUnlock: string
  sortId: string
  usesRawMaterial: boolean
}

/**
 * The structure of the enriched db.json file
 */
export interface EnrichedDbData {
  items: EnrichedItem[]
  recipes: EnrichedRecipe[]
}

// =============================================================================
// Legacy recipes.json types (kept for reference, will be removed)
// =============================================================================

/**
 * @deprecated Use EnrichedItem from enriched db.json instead
 */
export interface Item {
  id: string
  name: string
  localImagePath?: string
  category?: string
}

/**
 * @deprecated Facilities are now just items in the new data model
 */
export interface Facility {
  id: string
  name: string
  localImagePath?: string
  category: string
  processingTime?: number
  description?: string
}

/**
 * @deprecated Use EnrichedIngredient from enriched db.json instead
 */
export interface RecipeInput {
  item: string
  quantity: number
}

/**
 * @deprecated Use EnrichedRecipe from enriched db.json instead
 */
export interface Recipe {
  facility: string
  output: string
  inputs: RecipeInput[]
  outputQuantity?: number
  notes?: string
}

/**
 * @deprecated Use EnrichedDbData from enriched db.json instead
 */
export interface RecipesData {
  totalItems: number
  items: Item[]
  facilities: Facility[]
  recipes: Recipe[]
}

// =============================================================================
// Utility types for UI components
// =============================================================================

/**
 * Sort options for recipe browser
 */
export type RecipeSortField = 'default' | 'name' | 'craftTime' | 'type' | 'category'

/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc'

/**
 * Filter state for recipe browser
 */
export interface RecipeFilters {
  search: string
  types: RecipeType[]
  categories: string[]
  machines: string[]
  rarities: string[]
  usesRawMaterial: boolean | null
}

/**
 * View mode for list/grid display
 */
export type ViewMode = 'grid' | 'list'
