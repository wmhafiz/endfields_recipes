/**
 * Server-side data access helpers for Payload CMS
 *
 * These functions query Payload/Postgres and return data in the same shape
 * as the legacy db.json types (EnrichedDbData) for compatibility with
 * existing frontend components.
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
import type { Item, Machine, Media } from '@/payload-types'

// Environment flag for rollback - set USE_JSON_FALLBACK=true to use db.json
const USE_JSON_FALLBACK = process.env.USE_JSON_FALLBACK === 'true'

/**
 * Get all data from Payload in the EnrichedDbData shape
 * This is the main function used by pages that need all items and recipes
 */
export async function getAllData(): Promise<EnrichedDbData> {
  if (USE_JSON_FALLBACK) {
    const dbData = await import('@/data/db.json')
    return dbData.default as EnrichedDbData
  }

  const payload = await getPayload({ config })

  // Fetch all items
  const itemsResult = await payload.find({
    collection: 'items',
    limit: 10000,
    depth: 1, // Include media relationship
  })

  // Fetch all machines (for machine name lookup)
  const machinesResult = await payload.find({
    collection: 'machines',
    limit: 1000,
    depth: 1,
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
    localImagePath: item.localImagePath ?? getMediaUrl(item.image),
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
      category: recipe.category ?? '',
      machineId: machine?.machineId ?? '',
      machineName: machine?.machineName ?? '',
      machineImagePath: machine?.machineImagePath ?? getMediaUrl(machine?.image),
      ingredients,
      outputs,
      rarity: String(recipe.rarity ?? 0),
      craftTime: String(recipe.craftTime ?? 0),
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
    const dbData = await import('@/data/db.json')
    const data = dbData.default as EnrichedDbData
    return data.items.find((item) => item.slug === slug) ?? null
  }

  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'items',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 1,
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
    localImagePath: item.localImagePath ?? getMediaUrl(item.image),
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
