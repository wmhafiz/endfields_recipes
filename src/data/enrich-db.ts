/**
 * Enrichment script for db.json
 *
 * This script enriches the scraped db.json with:
 * - URL-friendly slugs derived from item names
 * - localImagePath copied from legacy recipes.json where names match
 * - Computed derived fields: isRawMaterial, usesRawMaterial
 *
 * Usage: npx tsx src/data/enrich-db.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Types for the raw db.json structure
interface RawIngredient {
  itemId: string
  itemName: string
  count: number
}

interface RawOutput {
  itemId: string
  itemName: string
  count: number
}

interface RawRecipe {
  id: string
  name: string
  description: string
  type: 'manual' | 'machine' | 'hub'
  category: string
  machineId: string
  machineName: string
  ingredients: RawIngredient[]
  outputs: RawOutput[]
  rarity: string
  craftTime: string
  defaultUnlock: string
  sortId: string
}

// Types for legacy recipes.json
interface LegacyItem {
  id: string
  name: string
  localImagePath?: string
  category?: string
}

interface LegacyFacility {
  id: string
  name: string
  localImagePath?: string
  category: string
  processingTime?: number
  description?: string
}

interface LegacyRecipesData {
  totalItems: number
  items: LegacyItem[]
  facilities: LegacyFacility[]
  recipes: unknown[]
}

// Enriched types
interface EnrichedItem {
  itemId: string
  itemName: string
  slug: string
  localImagePath?: string
  isRawMaterial: boolean
}

interface EnrichedIngredient extends RawIngredient {
  slug: string
}

interface EnrichedOutput extends RawOutput {
  slug: string
}

interface EnrichedRecipe extends Omit<RawRecipe, 'ingredients' | 'outputs'> {
  ingredients: EnrichedIngredient[]
  outputs: EnrichedOutput[]
  usesRawMaterial: boolean
  machineImagePath?: string
}

interface EnrichedDbData {
  items: EnrichedItem[]
  recipes: EnrichedRecipe[]
}

/**
 * Convert item name to URL-friendly slug
 * - Spaces become underscores
 * - Special chars (brackets, etc.) are removed or simplified
 */
function generateSlug(itemName: string): string {
  return (
    itemName
      // Replace spaces with underscores
      .replace(/\s+/g, '_')
      // Remove brackets and their content markers but keep letter
      .replace(/\[([A-Z])\]/g, '_$1_')
      // Remove other special characters
      .replace(/[^\w_]/g, '')
      // Collapse multiple underscores
      .replace(/_+/g, '_')
      // Remove leading/trailing underscores
      .replace(/^_|_$/g, '')
  )
}

/**
 * Handle slug collisions by appending a suffix
 */
function disambiguateSlug(
  baseSlug: string,
  existingSlugs: Map<string, string>,
  itemId: string,
): string {
  // Check if this exact slug already exists for a different itemId
  const existingItemId = existingSlugs.get(baseSlug)

  if (!existingItemId) {
    return baseSlug
  }

  if (existingItemId === itemId) {
    return baseSlug
  }

  // Collision: find next available suffix
  let counter = 2
  while (existingSlugs.has(`${baseSlug}_${counter}`)) {
    counter++
  }

  return `${baseSlug}_${counter}`
}

/**
 * Normalize item name for matching (handle minor punctuation differences)
 */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[-–—]/g, ' ') // Normalize dashes
    .replace(/\s+/g, ' ')
    .trim()
}

function main() {
  console.log('Starting db.json enrichment...')

  // Load db.json - may be either a raw array or already enriched structure
  const dbPath = path.join(__dirname, 'db.json')
  const rawDbContent = fs.readFileSync(dbPath, 'utf-8')
  const parsedDb = JSON.parse(rawDbContent)

  // Handle both raw array format and enriched format
  let rawRecipes: RawRecipe[]
  if (Array.isArray(parsedDb)) {
    rawRecipes = parsedDb
  } else if (parsedDb.recipes && Array.isArray(parsedDb.recipes)) {
    // Already enriched - extract recipes (strip enrichment fields for re-processing)
    rawRecipes = parsedDb.recipes.map((r: EnrichedRecipe) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      type: r.type,
      category: r.category,
      machineId: r.machineId,
      machineName: r.machineName,
      ingredients: r.ingredients.map((i: EnrichedIngredient) => ({
        itemId: i.itemId,
        itemName: i.itemName,
        count: i.count,
      })),
      outputs: r.outputs.map((o: EnrichedOutput) => ({
        itemId: o.itemId,
        itemName: o.itemName,
        count: o.count,
      })),
      rarity: r.rarity,
      craftTime: r.craftTime,
      defaultUnlock: r.defaultUnlock,
      sortId: r.sortId,
    }))
  } else {
    throw new Error('Invalid db.json format')
  }
  console.log(`Loaded ${rawRecipes.length} recipes from db.json`)

  // Load legacy recipes.json
  const legacyPath = path.join(__dirname, 'recipes.json')
  const legacyContent = fs.readFileSync(legacyPath, 'utf-8')
  const legacyData: LegacyRecipesData = JSON.parse(legacyContent)
  console.log(`Loaded ${legacyData.items.length} items and ${legacyData.facilities.length} facilities from legacy recipes.json`)

  // Build a lookup map for legacy items/facilities by normalized name
  const legacyImageMap = new Map<string, string>()
  for (const item of legacyData.items) {
    if (item.localImagePath) {
      legacyImageMap.set(normalizeName(item.name), item.localImagePath)
    }
  }
  for (const facility of legacyData.facilities) {
    if (facility.localImagePath) {
      legacyImageMap.set(normalizeName(facility.name), facility.localImagePath)
    }
  }
  console.log(`Built legacy image lookup with ${legacyImageMap.size} entries`)

  // Build unique item list from all ingredients and outputs
  const itemsById = new Map<string, { itemId: string; itemName: string }>()
  const outputItemIds = new Set<string>()
  const ingredientItemIds = new Set<string>()

  for (const recipe of rawRecipes) {
    for (const ingredient of recipe.ingredients) {
      itemsById.set(ingredient.itemId, {
        itemId: ingredient.itemId,
        itemName: ingredient.itemName,
      })
      ingredientItemIds.add(ingredient.itemId)
    }
    for (const output of recipe.outputs) {
      itemsById.set(output.itemId, {
        itemId: output.itemId,
        itemName: output.itemName,
      })
      outputItemIds.add(output.itemId)
    }
  }
  console.log(`Found ${itemsById.size} unique items`)

  // Generate slugs for each item (handling collisions)
  const slugsByItemId = new Map<string, string>()
  const existingSlugs = new Map<string, string>() // slug -> itemId

  // Sort items by itemId for deterministic slug assignment
  const sortedItems = Array.from(itemsById.values()).sort((a, b) =>
    a.itemId.localeCompare(b.itemId),
  )

  for (const item of sortedItems) {
    const baseSlug = generateSlug(item.itemName)
    const slug = disambiguateSlug(baseSlug, existingSlugs, item.itemId)

    if (slug !== baseSlug) {
      console.log(`  Slug collision: "${item.itemName}" (${item.itemId}) -> ${slug}`)
    }

    slugsByItemId.set(item.itemId, slug)
    existingSlugs.set(slug, item.itemId)
  }

  // Build enriched items list
  const enrichedItems: EnrichedItem[] = []
  for (const item of sortedItems) {
    const slug = slugsByItemId.get(item.itemId)!
    const normalizedName = normalizeName(item.itemName)
    const localImagePath = legacyImageMap.get(normalizedName)

    // isRawMaterial: appears as ingredient but never as output
    const isRawMaterial = ingredientItemIds.has(item.itemId) && !outputItemIds.has(item.itemId)

    const enrichedItem: EnrichedItem = {
      itemId: item.itemId,
      itemName: item.itemName,
      slug,
      isRawMaterial,
    }

    if (localImagePath) {
      enrichedItem.localImagePath = localImagePath
    }

    enrichedItems.push(enrichedItem)
  }

  // Build raw material set for recipe enrichment
  const rawMaterialIds = new Set(
    enrichedItems.filter((item) => item.isRawMaterial).map((item) => item.itemId),
  )
  console.log(`Identified ${rawMaterialIds.size} raw materials`)

  // Build machine image lookup from legacy facilities
  const machineImageMap = new Map<string, string>()
  for (const facility of legacyData.facilities) {
    if (facility.localImagePath) {
      machineImageMap.set(normalizeName(facility.name), facility.localImagePath)
    }
  }
  console.log(`Built machine image lookup with ${machineImageMap.size} entries`)

  // Enrich recipes
  const enrichedRecipes: EnrichedRecipe[] = rawRecipes.map((recipe) => {
    // Enrich ingredients with slugs
    const enrichedIngredients: EnrichedIngredient[] = recipe.ingredients.map((ing) => ({
      ...ing,
      slug: slugsByItemId.get(ing.itemId)!,
    }))

    // Enrich outputs with slugs
    const enrichedOutputs: EnrichedOutput[] = recipe.outputs.map((out) => ({
      ...out,
      slug: slugsByItemId.get(out.itemId)!,
    }))

    // Compute usesRawMaterial
    const usesRawMaterial = recipe.ingredients.some((ing) => rawMaterialIds.has(ing.itemId))

    // Get machine image path
    const machineImagePath = machineImageMap.get(normalizeName(recipe.machineName))

    const enrichedRecipe: EnrichedRecipe = {
      ...recipe,
      ingredients: enrichedIngredients,
      outputs: enrichedOutputs,
      usesRawMaterial,
    }

    if (machineImagePath) {
      enrichedRecipe.machineImagePath = machineImagePath
    }

    return enrichedRecipe
  })

  // Build final enriched data structure
  const enrichedData: EnrichedDbData = {
    items: enrichedItems,
    recipes: enrichedRecipes,
  }

  // Write enriched data back to db.json
  fs.writeFileSync(dbPath, JSON.stringify(enrichedData, null, 2) + '\n')
  console.log(`\nEnriched db.json written successfully!`)
  console.log(`  - ${enrichedItems.length} unique items`)
  console.log(`  - ${enrichedRecipes.length} recipes`)
  console.log(`  - ${enrichedItems.filter((i) => i.localImagePath).length} items with images`)
  console.log(`  - ${enrichedItems.filter((i) => i.isRawMaterial).length} raw materials`)
  console.log(`  - ${enrichedRecipes.filter((r) => r.usesRawMaterial).length} recipes using raw materials`)
}

main()
