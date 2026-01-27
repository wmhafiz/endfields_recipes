/**
 * Canonical TypeScript interfaces for recipes.json data
 * Import these types rather than defining duplicates in components
 */

export interface Item {
  id: string
  name: string
  localImagePath?: string
  category?: string
}

export interface Facility {
  id: string
  name: string
  localImagePath?: string
  category: string
  processingTime?: number
  description?: string
}

export interface RecipeInput {
  item: string
  quantity: number
}

export interface Recipe {
  facility: string
  output: string
  inputs: RecipeInput[]
  outputQuantity?: number
  notes?: string
}

export interface RecipesData {
  totalItems: number
  items: Item[]
  facilities: Facility[]
  recipes: Recipe[]
}
