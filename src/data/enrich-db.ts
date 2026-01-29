/**
 * Enrichment script for db.json
 *
 * This script enriches the scraped db.json with:
 * - URL-friendly slugs derived from item names
 * - Computed derived fields: isRawMaterial, usesRawMaterial
 *
 * Note: Legacy image path fields (localImagePath, machineImagePath) are no longer
 * enriched into db.json. The seed script handles image imports by looking up
 * legacy recipes.json directly and linking to media relationships.
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

// Enriched types
interface EnrichedItem {
  itemId: string
  itemName: string
  slug: string
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

  // Note: Legacy recipes.json is no longer used for image path enrichment.
  // The seed script handles image imports directly from legacy recipes.json.

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

    // isRawMaterial: appears as ingredient but never as output
    const isRawMaterial = ingredientItemIds.has(item.itemId) && !outputItemIds.has(item.itemId)

    const enrichedItem: EnrichedItem = {
      itemId: item.itemId,
      itemName: item.itemName,
      slug,
      isRawMaterial,
    }

    enrichedItems.push(enrichedItem)
  }

  // Build raw material set for recipe enrichment
  const rawMaterialIds = new Set(
    enrichedItems.filter((item) => item.isRawMaterial).map((item) => item.itemId),
  )
  console.log(`Identified ${rawMaterialIds.size} raw materials`)

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

    const enrichedRecipe: EnrichedRecipe = {
      ...recipe,
      ingredients: enrichedIngredients,
      outputs: enrichedOutputs,
      usesRawMaterial,
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
  console.log(`  - ${enrichedItems.filter((i) => i.isRawMaterial).length} raw materials`)
  console.log(
    `  - ${enrichedRecipes.filter((r) => r.usesRawMaterial).length} recipes using raw materials`,
  )
}

main()
