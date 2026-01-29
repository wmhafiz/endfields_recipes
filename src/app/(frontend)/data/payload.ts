/**
 * Server-side data access helpers for Payload CMS
 *
 * These functions query Payload/Postgres and return data in the canonical
 * frontend shape for use by UI components.
 */
import { getPayload } from 'payload'
import config from '@payload-config'
import type {
  EnrichedDbData,
  EnrichedItem,
  EnrichedRecipe,
  EnrichedIngredient,
  EnrichedOutput,
} from '../types/recipes'
import type { Item, Machine, Media, ItemCategory } from '@/payload-types'

// Environment flag for rollback - set USE_JSON_FALLBACK=true to use db.json
const USE_JSON_FALLBACK = process.env.USE_JSON_FALLBACK === 'true'

/**
 * Get all data from Payload in the EnrichedDbData shape
 * This is the main function used by pages that need all items and recipes
 */
export async function getAllData(): Promise<EnrichedDbData> {
  if (USE_JSON_FALLBACK) {
    // Note: The legacy db.json format will need to be transformed
    // if used as fallback. For now, this path is deprecated.
    const dbData = await import('@/data/db.json')
    return transformLegacyDbData(dbData.default)
  }

  const payload = await getPayload({ config })

  // Fetch all items with category populated
  const itemsResult = await payload.find({
    collection: 'items',
    limit: 10000,
    depth: 2, // Include media and category relationships
  })

  // Fetch all machines with category populated
  const machinesResult = await payload.find({
    collection: 'machines',
    limit: 1000,
    depth: 2,
  })

  // Fetch all recipes with relationships populated
  const recipesResult = await payload.find({
    collection: 'recipes',
    limit: 10000,
    depth: 2, // Include machine and item relationships
  })

  // Build machine lookup
  const machinesById = new Map<number, Machine>()
  for (const machine of machinesResult.docs) {
    machinesById.set(machine.id, machine)
  }

  // Build item lookup by Payload ID
  const itemsById = new Map<number, Item>()
  for (const item of itemsResult.docs) {
    itemsById.set(item.id, item)
  }

  // Transform items to EnrichedItem format
  const items: EnrichedItem[] = itemsResult.docs.map((item) => ({
    itemId: item.itemId,
    itemName: item.itemName,
    slug: item.slug,
    isRawMaterial: item.isRawMaterial ?? false,
    imageUrl: getMediaUrl(item.image),
    category: getCategoryName(item.category),
    rarity: item.rarity ?? 0,
    sortId: item.sortId ?? undefined,
  }))

  // Transform recipes to EnrichedRecipe format
  const recipes: EnrichedRecipe[] = recipesResult.docs.map((recipe) => {
    // Get machine info
    const machine =
      typeof recipe.machine === 'number' ? machinesById.get(recipe.machine) : recipe.machine

    // Transform ingredients
    const ingredients: EnrichedIngredient[] = (recipe.ingredients ?? []).map((ing) => {
      const item = typeof ing.item === 'number' ? itemsById.get(ing.item) : ing.item
      return {
        itemId: item?.itemId ?? '',
        itemName: item?.itemName ?? '',
        count: ing.count ?? 1,
        slug: item?.slug ?? '',
      }
    })

    // Transform outputs
    const outputs: EnrichedOutput[] = (recipe.outputs ?? []).map((out) => {
      const item = typeof out.item === 'number' ? itemsById.get(out.item) : out.item
      return {
        itemId: item?.itemId ?? '',
        itemName: item?.itemName ?? '',
        count: out.count ?? 1,
        slug: item?.slug ?? '',
      }
    })

    return {
      id: recipe.recipeId,
      name: recipe.name,
      description: recipe.description ?? '',
      type: recipe.type as 'manual' | 'machine' | 'hub',
      machineId: machine?.machineId ?? '',
      machineName: machine?.machineName ?? '',
      machineImageUrl: getMediaUrl(machine?.image),
      machineCraftTime: machine?.craftTime ?? 0,
      ingredients,
      outputs,
      rarity: String(recipe.rarity ?? 0),
      defaultUnlock: String(recipe.defaultUnlock ?? 0),
      sortId: String(recipe.sortId ?? 0),
      usesRawMaterial: recipe.usesRawMaterial ?? false,
    }
  })

  return { items, recipes }
}

/**
 * Get a single item by slug
 */
export async function getItemBySlug(slug: string): Promise<EnrichedItem | null> {
  if (USE_JSON_FALLBACK) {
    const allData = await getAllData()
    return allData.items.find((item) => item.slug === slug) ?? null
  }

  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'items',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 2,
  })

  if (result.docs.length === 0) {
    return null
  }

  const item = result.docs[0]
  return {
    itemId: item.itemId,
    itemName: item.itemName,
    slug: item.slug,
    isRawMaterial: item.isRawMaterial ?? false,
    imageUrl: getMediaUrl(item.image),
    category: getCategoryName(item.category),
    rarity: item.rarity ?? 0,
    sortId: item.sortId ?? undefined,
  }
}

/**
 * Get recipes that produce a specific item (by itemId)
 */
export async function getRecipesProducingItem(itemId: string): Promise<EnrichedRecipe[]> {
  const allData = await getAllData()
  return allData.recipes.filter((recipe) => recipe.outputs.some((o) => o.itemId === itemId))
}

/**
 * Get recipes that use a specific item as an ingredient (by itemId)
 */
export async function getRecipesUsingItem(itemId: string): Promise<EnrichedRecipe[]> {
  const allData = await getAllData()
  return allData.recipes.filter((recipe) => recipe.ingredients.some((i) => i.itemId === itemId))
}

/**
 * Helper to get the URL from a media relationship
 */
function getMediaUrl(media: number | Media | null | undefined): string | undefined {
  if (!media) return undefined
  if (typeof media === 'number') return undefined
  return media.url ?? undefined
}

/**
 * Helper to get category name from a category relationship
 */
function getCategoryName(category: number | ItemCategory | null | undefined): string | undefined {
  if (!category) return undefined
  if (typeof category === 'number') return undefined
  return category.name ?? undefined
}

/**
 * Transform legacy db.json format to new EnrichedDbData format
 * Used for fallback mode compatibility
 */
function transformLegacyDbData(legacyData: {
  items: Array<{
    itemId: string
    itemName: string
    slug: string
    isRawMaterial: boolean
    localImagePath?: string
  }>
  recipes: Array<{
    id: string
    name: string
    description: string
    type: string
    category?: string
    machineId: string
    machineName: string
    machineImagePath?: string
    ingredients: Array<{ itemId: string; itemName: string; count: number; slug: string }>
    outputs: Array<{ itemId: string; itemName: string; count: number; slug: string }>
    rarity: string
    craftTime?: string
    defaultUnlock: string
    sortId: string
    usesRawMaterial: boolean
  }>
}): EnrichedDbData {
  const items: EnrichedItem[] = legacyData.items.map((item) => ({
    itemId: item.itemId,
    itemName: item.itemName,
    slug: item.slug,
    isRawMaterial: item.isRawMaterial,
    // Convert legacy localImagePath to imageUrl format
    imageUrl: item.localImagePath ? `/${item.localImagePath}` : undefined,
  }))

  const recipes: EnrichedRecipe[] = legacyData.recipes.map((recipe) => ({
    id: recipe.id,
    name: recipe.name,
    description: recipe.description,
    type: recipe.type as 'manual' | 'machine' | 'hub',
    machineId: recipe.machineId,
    machineName: recipe.machineName,
    machineImageUrl: recipe.machineImagePath ? `/${recipe.machineImagePath}` : undefined,
    machineCraftTime: parseInt(recipe.craftTime ?? '0', 10),
    ingredients: recipe.ingredients,
    outputs: recipe.outputs,
    rarity: recipe.rarity,
    defaultUnlock: recipe.defaultUnlock,
    sortId: recipe.sortId,
    usesRawMaterial: recipe.usesRawMaterial,
  }))

  return { items, recipes }
}
