/**
 * Seed script: Imports data from src/data/db.json into Payload CMS (Postgres)
 *
 * Usage: pnpm seed [--skip-media] [--reset]
 *
 * Options:
 *   --skip-media  Skip importing media files
 *   --reset       Delete all existing data before seeding (recipes → machines → items → media)
 *
 * This script is idempotent - safe to run multiple times without creating duplicates.
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../payload.config'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Type definitions for db.json structure
interface DbItem {
  itemId: string
  itemName: string
  slug: string
  isRawMaterial: boolean
  localImagePath?: string
}

interface DbRecipeItem {
  itemId: string
  itemName: string
  count: number
  slug: string
}

interface DbRecipe {
  id: string
  name: string
  description: string
  type: string
  category: string
  machineId: string
  machineName: string
  ingredients: DbRecipeItem[]
  outputs: DbRecipeItem[]
  rarity: string
  craftTime: string
  defaultUnlock: string
  sortId: string
  usesRawMaterial: boolean
  machineImagePath?: string
}

interface DbData {
  items: DbItem[]
  recipes: DbRecipe[]
}

// Type definitions for legacy recipes.json
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
  category?: string
  processingTime?: number
}

interface LegacyRecipesData {
  totalItems: number
  items: LegacyItem[]
  facilities: LegacyFacility[]
  recipes: unknown[]
}

const SKIP_MEDIA = process.argv.includes('--skip-media')
const RESET_MODE = process.argv.includes('--reset')

/**
 * Normalize item name for matching (handle minor punctuation differences)
 */
function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[-–—]/g, ' ').replace(/\s+/g, ' ').trim()
}

async function seed() {
  console.log('Starting seed process...')
  console.log(`Media import: ${SKIP_MEDIA ? 'SKIPPED' : 'ENABLED'}`)
  console.log(`Reset mode: ${RESET_MODE ? 'ENABLED' : 'DISABLED'}`)

  // Load db.json
  const dbPath = path.resolve(__dirname, '../data/db.json')
  const dbData: DbData = JSON.parse(fs.readFileSync(dbPath, 'utf-8'))

  // Load legacy recipes.json for category data
  const legacyPath = path.resolve(__dirname, '../data/recipes.json')
  const legacyData: LegacyRecipesData = JSON.parse(fs.readFileSync(legacyPath, 'utf-8'))

  console.log(`Found ${dbData.items.length} items and ${dbData.recipes.length} recipes`)

  // Initialize Payload
  const payload = await getPayload({ config })

  // Reset mode: delete existing data in order
  if (RESET_MODE) {
    console.log('\n--- RESET MODE: Deleting existing data ---')

    // Delete recipes first (depends on machines and items)
    const recipeCount = await payload.delete({
      collection: 'recipes',
      where: { id: { exists: true } },
    })
    console.log(`Deleted ${recipeCount.docs.length} recipes`)

    // Delete machines (depends on machine-categories)
    const machineCount = await payload.delete({
      collection: 'machines',
      where: { id: { exists: true } },
    })
    console.log(`Deleted ${machineCount.docs.length} machines`)

    // Delete items (depends on item-categories)
    const itemCount = await payload.delete({
      collection: 'items',
      where: { id: { exists: true } },
    })
    console.log(`Deleted ${itemCount.docs.length} items`)

    // Delete categories
    const itemCatCount = await payload.delete({
      collection: 'item-categories',
      where: { id: { exists: true } },
    })
    console.log(`Deleted ${itemCatCount.docs.length} item categories`)

    const machineCatCount = await payload.delete({
      collection: 'machine-categories',
      where: { id: { exists: true } },
    })
    console.log(`Deleted ${machineCatCount.docs.length} machine categories`)

    // Optionally delete media (only if not skipping media import)
    if (!SKIP_MEDIA) {
      const mediaCount = await payload.delete({
        collection: 'media',
        where: { id: { exists: true } },
      })
      console.log(`Deleted ${mediaCount.docs.length} media files`)
    }

    console.log('--- Reset complete ---\n')
  }

  // Build lookup maps
  const itemIdToPayloadId = new Map<string, number>()
  const machineIdToPayloadId = new Map<string, number>()
  const sourcePathToMediaId = new Map<string, number>()
  const itemCategoryNameToId = new Map<string, number>()
  const machineCategoryNameToId = new Map<string, number>()

  // Build category lookup from legacy recipes.json
  const legacyItemCategoryByName = new Map<string, string>()
  for (const item of legacyData.items) {
    if (item.category) {
      legacyItemCategoryByName.set(normalizeName(item.name), item.category)
    }
  }

  const legacyFacilityCategoryByName = new Map<string, string>()
  for (const facility of legacyData.facilities) {
    if (facility.category) {
      legacyFacilityCategoryByName.set(normalizeName(facility.name), facility.category)
    }
  }

  // Phase 0: Extract unique machines from recipes and compute craft times
  const machineMap = new Map<
    string,
    {
      machineId: string
      machineName: string
      machineImagePath?: string
      craftTimes: Set<number>
    }
  >()

  for (const recipe of dbData.recipes) {
    const machineId = recipe.machineId || 'manual'
    const craftTime = parseInt(recipe.craftTime, 10) || 0

    if (!machineMap.has(machineId)) {
      machineMap.set(machineId, {
        machineId,
        machineName: recipe.machineName || 'Manual Crafting',
        machineImagePath: recipe.machineImagePath,
        craftTimes: new Set([craftTime]),
      })
    } else {
      const machine = machineMap.get(machineId)!
      machine.craftTimes.add(craftTime)
      // Prefer machineImagePath if we find one
      if (recipe.machineImagePath && !machine.machineImagePath) {
        machine.machineImagePath = recipe.machineImagePath
      }
    }
  }

  console.log(`Found ${machineMap.size} unique machines`)

  // Phase 1: Upsert item categories
  console.log('\nPhase 1: Upserting item categories...')
  const uniqueItemCategories = new Set<string>()
  for (const category of legacyItemCategoryByName.values()) {
    uniqueItemCategories.add(category)
  }

  for (const categoryName of uniqueItemCategories) {
    try {
      const existing = await payload.find({
        collection: 'item-categories',
        where: { name: { equals: categoryName } },
        limit: 1,
      })

      if (existing.docs.length > 0) {
        itemCategoryNameToId.set(categoryName, existing.docs[0].id)
      } else {
        const created = await payload.create({
          collection: 'item-categories',
          data: { name: categoryName },
        })
        itemCategoryNameToId.set(categoryName, created.id)
        console.log(`Created item category: ${categoryName}`)
      }
    } catch (error) {
      console.log(
        `Warning: Failed to upsert item category ${categoryName}:`,
        error instanceof Error ? error.message : error,
      )
    }
  }
  console.log(`Upserted ${itemCategoryNameToId.size} item categories`)

  // Phase 2: Upsert machine categories
  console.log('\nPhase 2: Upserting machine categories...')
  const uniqueMachineCategories = new Set<string>()
  for (const category of legacyFacilityCategoryByName.values()) {
    uniqueMachineCategories.add(category)
  }

  for (const categoryName of uniqueMachineCategories) {
    try {
      const existing = await payload.find({
        collection: 'machine-categories',
        where: { name: { equals: categoryName } },
        limit: 1,
      })

      if (existing.docs.length > 0) {
        machineCategoryNameToId.set(categoryName, existing.docs[0].id)
      } else {
        const created = await payload.create({
          collection: 'machine-categories',
          data: { name: categoryName },
        })
        machineCategoryNameToId.set(categoryName, created.id)
        console.log(`Created machine category: ${categoryName}`)
      }
    } catch (error) {
      console.log(
        `Warning: Failed to upsert machine category ${categoryName}:`,
        error instanceof Error ? error.message : error,
      )
    }
  }
  console.log(`Upserted ${machineCategoryNameToId.size} machine categories`)

  // Phase 3: Import media (if not skipped)
  if (!SKIP_MEDIA) {
    console.log('\nPhase 3: Importing media...')

    // Collect all image paths
    const imagePaths = new Set<string>()
    for (const item of dbData.items) {
      if (item.localImagePath) {
        imagePaths.add(item.localImagePath)
      }
    }
    for (const machine of machineMap.values()) {
      if (machine.machineImagePath) {
        imagePaths.add(machine.machineImagePath)
      }
    }

    console.log(`Found ${imagePaths.size} unique image paths`)

    for (const sourcePath of imagePaths) {
      try {
        // Check if already exists
        const existing = await payload.find({
          collection: 'media',
          where: { sourcePath: { equals: sourcePath } },
          limit: 1,
        })

        if (existing.docs.length > 0) {
          sourcePathToMediaId.set(sourcePath, existing.docs[0].id)
          continue
        }

        // Check if file exists
        const publicPath = path.resolve(__dirname, '../../public', sourcePath)
        if (!fs.existsSync(publicPath)) {
          console.log(`Warning: Missing image: ${sourcePath}`)
          continue
        }

        // Read file and create media
        const fileBuffer = fs.readFileSync(publicPath)
        const fileName = path.basename(sourcePath)
        const ext = path.extname(fileName).toLowerCase()
        const mimeType =
          ext === '.png'
            ? 'image/png'
            : ext === '.jpg' || ext === '.jpeg'
              ? 'image/jpeg'
              : ext === '.gif'
                ? 'image/gif'
                : ext === '.webp'
                  ? 'image/webp'
                  : 'image/png'

        const media = await payload.create({
          collection: 'media',
          data: {
            alt: fileName.replace(/\.[^.]+$/, '').replace(/_/g, ' '),
            sourcePath,
          },
          file: {
            data: fileBuffer,
            name: fileName,
            mimetype: mimeType,
            size: fileBuffer.length,
          },
        })

        sourcePathToMediaId.set(sourcePath, media.id)
        console.log(`Uploaded: ${sourcePath}`)
      } catch (error) {
        console.log(
          `Warning: Failed to import ${sourcePath}:`,
          error instanceof Error ? error.message : error,
        )
      }
    }

    console.log(`Imported ${sourcePathToMediaId.size} media files`)
  } else {
    console.log('\nPhase 3: Skipping media import (--skip-media flag)')
  }

  // Phase 4: Upsert items with new fields
  console.log('\nPhase 4: Upserting items...')
  let itemsCreated = 0
  let itemsUpdated = 0

  for (const item of dbData.items) {
    try {
      // Check if exists
      const existing = await payload.find({
        collection: 'items',
        where: { itemId: { equals: item.itemId } },
        limit: 1,
      })

      const imageId = item.localImagePath ? sourcePathToMediaId.get(item.localImagePath) : undefined

      // Look up category from legacy data by item name
      const normalizedName = normalizeName(item.itemName)
      const categoryName = legacyItemCategoryByName.get(normalizedName)
      const categoryId = categoryName ? itemCategoryNameToId.get(categoryName) : undefined

      // For rarity, we'll derive it from recipes that output this item
      // Find recipes that produce this item and get the max rarity
      const outputtingRecipes = dbData.recipes.filter((r) =>
        r.outputs.some((o) => o.itemId === item.itemId),
      )
      const itemRarity =
        outputtingRecipes.length > 0
          ? Math.max(...outputtingRecipes.map((r) => parseInt(r.rarity, 10) || 0))
          : 0

      // Get sortId from the first recipe that outputs this item (if any)
      const itemSortId =
        outputtingRecipes.length > 0
          ? parseInt(outputtingRecipes[0].sortId, 10) || undefined
          : undefined

      const itemData = {
        itemId: item.itemId,
        itemName: item.itemName,
        slug: item.slug,
        isRawMaterial: item.isRawMaterial,
        rarity: itemRarity,
        ...(itemSortId !== undefined && { sortId: itemSortId }),
        ...(categoryId && { category: categoryId }),
        ...(imageId && { image: imageId }),
      }

      if (existing.docs.length > 0) {
        await payload.update({
          collection: 'items',
          id: existing.docs[0].id,
          data: itemData,
        })
        itemIdToPayloadId.set(item.itemId, existing.docs[0].id)
        itemsUpdated++
      } else {
        const created = await payload.create({
          collection: 'items',
          data: itemData,
        })
        itemIdToPayloadId.set(item.itemId, created.id)
        itemsCreated++
      }
    } catch (error) {
      console.log(
        `Warning: Failed to upsert item ${item.itemId}:`,
        error instanceof Error ? error.message : error,
      )
    }
  }

  console.log(`Created ${itemsCreated}, updated ${itemsUpdated} items`)

  // Phase 5: Upsert machines with new fields
  console.log('\nPhase 5: Upserting machines...')
  let machinesCreated = 0
  let machinesUpdated = 0

  for (const machine of machineMap.values()) {
    try {
      const existing = await payload.find({
        collection: 'machines',
        where: { machineId: { equals: machine.machineId } },
        limit: 1,
      })

      const imageId = machine.machineImagePath
        ? sourcePathToMediaId.get(machine.machineImagePath)
        : undefined

      // Look up category from legacy data by machine name
      const normalizedName = normalizeName(machine.machineName)
      const categoryName = legacyFacilityCategoryByName.get(normalizedName)
      const categoryId = categoryName ? machineCategoryNameToId.get(categoryName) : undefined

      // Derive craftTime from associated recipes
      // Rule: If multiple craft times exist, warn and use the minimum (deterministic)
      const craftTimesArray = Array.from(machine.craftTimes)
      let craftTime = 0
      if (craftTimesArray.length === 1) {
        craftTime = craftTimesArray[0]
      } else if (craftTimesArray.length > 1) {
        // Filter out 0 values for comparison (0 often means "instant" or unset)
        const nonZeroTimes = craftTimesArray.filter((t) => t > 0)
        if (nonZeroTimes.length > 0) {
          craftTime = Math.min(...nonZeroTimes)
          console.log(
            `Warning: Machine "${machine.machineName}" (${machine.machineId}) has inconsistent craft times: [${craftTimesArray.join(', ')}]. Using minimum non-zero: ${craftTime}`,
          )
        } else {
          craftTime = 0
        }
      }

      const machineData = {
        machineId: machine.machineId,
        machineName: machine.machineName,
        rarity: 0, // Default to 0 as no reliable source exists
        craftTime,
        ...(categoryId && { category: categoryId }),
        ...(imageId && { image: imageId }),
      }

      if (existing.docs.length > 0) {
        await payload.update({
          collection: 'machines',
          id: existing.docs[0].id,
          data: machineData,
        })
        machineIdToPayloadId.set(machine.machineId, existing.docs[0].id)
        machinesUpdated++
      } else {
        const created = await payload.create({
          collection: 'machines',
          data: machineData,
        })
        machineIdToPayloadId.set(machine.machineId, created.id)
        machinesCreated++
      }
    } catch (error) {
      console.log(
        `Warning: Failed to upsert machine ${machine.machineId}:`,
        error instanceof Error ? error.message : error,
      )
    }
  }

  console.log(`Created ${machinesCreated}, updated ${machinesUpdated} machines`)

  // Phase 6: Upsert recipes (without category and craftTime)
  console.log('\nPhase 6: Upserting recipes...')
  let recipesCreated = 0
  let recipesUpdated = 0
  let recipesSkipped = 0

  for (const recipe of dbData.recipes) {
    try {
      const machineId = recipe.machineId || 'manual'
      const machinePayloadId = machineIdToPayloadId.get(machineId)

      if (!machinePayloadId) {
        console.log(`Warning: Skipping recipe ${recipe.id}: machine ${machineId} not found`)
        recipesSkipped++
        continue
      }

      // Resolve ingredient item IDs
      const ingredients = []
      let skipRecipe = false
      for (const ing of recipe.ingredients) {
        const itemPayloadId = itemIdToPayloadId.get(ing.itemId)
        if (!itemPayloadId) {
          console.log(
            `Warning: Skipping recipe ${recipe.id}: ingredient item ${ing.itemId} not found`,
          )
          skipRecipe = true
          break
        }
        ingredients.push({
          item: itemPayloadId,
          count: ing.count,
        })
      }
      if (skipRecipe) {
        recipesSkipped++
        continue
      }

      // Resolve output item IDs
      const outputs = []
      for (const out of recipe.outputs) {
        const itemPayloadId = itemIdToPayloadId.get(out.itemId)
        if (!itemPayloadId) {
          console.log(`Warning: Skipping recipe ${recipe.id}: output item ${out.itemId} not found`)
          skipRecipe = true
          break
        }
        outputs.push({
          item: itemPayloadId,
          count: out.count,
        })
      }
      if (skipRecipe) {
        recipesSkipped++
        continue
      }

      const existing = await payload.find({
        collection: 'recipes',
        where: { recipeId: { equals: recipe.id } },
        limit: 1,
      })

      // Note: category and craftTime are removed from recipes schema
      const recipeData = {
        recipeId: recipe.id,
        name: recipe.name,
        description: recipe.description,
        type: recipe.type,
        machine: machinePayloadId,
        ingredients,
        outputs,
        rarity: parseInt(recipe.rarity, 10) || 0,
        defaultUnlock: parseInt(recipe.defaultUnlock, 10) || 0,
        sortId: parseInt(recipe.sortId, 10) || 0,
        usesRawMaterial: recipe.usesRawMaterial,
      }

      if (existing.docs.length > 0) {
        await payload.update({
          collection: 'recipes',
          id: existing.docs[0].id,
          data: recipeData,
        })
        recipesUpdated++
      } else {
        await payload.create({
          collection: 'recipes',
          data: recipeData,
        })
        recipesCreated++
      }
    } catch (error) {
      console.log(
        `Warning: Failed to upsert recipe ${recipe.id}:`,
        error instanceof Error ? error.message : error,
      )
      recipesSkipped++
    }
  }

  console.log(`Created ${recipesCreated}, updated ${recipesUpdated}, skipped ${recipesSkipped}`)

  // Summary
  console.log('\nSeed complete!')
  console.log(`Item categories: ${itemCategoryNameToId.size}`)
  console.log(`Machine categories: ${machineCategoryNameToId.size}`)
  console.log(`Items: ${itemIdToPayloadId.size}`)
  console.log(`Machines: ${machineIdToPayloadId.size}`)
  console.log(`Recipes: ${recipesCreated + recipesUpdated}`)
  if (!SKIP_MEDIA) {
    console.log(`Media: ${sourcePathToMediaId.size}`)
  }

  process.exit(0)
}

seed().catch((error) => {
  console.error('Seed failed:', error)
  process.exit(1)
})
