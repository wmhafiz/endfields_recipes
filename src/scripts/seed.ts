/**
 * Seed script: Imports data from src/data/db.json into Payload CMS (Postgres)
 *
 * Usage: pnpm seed [--skip-media]
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

const SKIP_MEDIA = process.argv.includes('--skip-media')

async function seed() {
  console.log('Starting seed process...')
  console.log(`Media import: ${SKIP_MEDIA ? 'SKIPPED' : 'ENABLED'}`)

  // Load db.json
  const dbPath = path.resolve(__dirname, '../data/db.json')
  const dbData: DbData = JSON.parse(fs.readFileSync(dbPath, 'utf-8'))

  console.log(`Found ${dbData.items.length} items and ${dbData.recipes.length} recipes`)

  // Initialize Payload
  const payload = await getPayload({ config })

  // Build lookup maps
  const itemIdToPayloadId = new Map<string, number>()
  const machineIdToPayloadId = new Map<string, number>()
  const sourcePathToMediaId = new Map<string, number>()

  // Phase 0: Extract unique machines from recipes
  const machineMap = new Map<
    string,
    { machineId: string; machineName: string; machineImagePath?: string }
  >()

  for (const recipe of dbData.recipes) {
    const machineId = recipe.machineId || 'manual'
    if (!machineMap.has(machineId)) {
      machineMap.set(machineId, {
        machineId,
        machineName: recipe.machineName || 'Manual Crafting',
        machineImagePath: recipe.machineImagePath,
      })
    }
    // Prefer machineImagePath if we find one
    if (recipe.machineImagePath && !machineMap.get(machineId)?.machineImagePath) {
      machineMap.get(machineId)!.machineImagePath = recipe.machineImagePath
    }
  }

  console.log(`Found ${machineMap.size} unique machines`)

  // Phase 1: Import media (if not skipped)
  if (!SKIP_MEDIA) {
    console.log('\nPhase 1: Importing media...')

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
    console.log('\nPhase 1: Skipping media import (--skip-media flag)')
  }

  // Phase 2: Upsert items
  console.log('\nPhase 2: Upserting items...')
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

      const imageId = item.localImagePath
        ? sourcePathToMediaId.get(item.localImagePath)
        : undefined

      const itemData = {
        itemId: item.itemId,
        itemName: item.itemName,
        slug: item.slug,
        isRawMaterial: item.isRawMaterial,
        localImagePath: item.localImagePath,
        image: imageId,
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

  // Phase 3: Upsert machines
  console.log('\nPhase 3: Upserting machines...')
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

      const machineData = {
        machineId: machine.machineId,
        machineName: machine.machineName,
        machineImagePath: machine.machineImagePath,
        image: imageId,
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

  // Phase 4: Upsert recipes
  console.log('\nPhase 4: Upserting recipes...')
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
          console.log(
            `Warning: Skipping recipe ${recipe.id}: output item ${out.itemId} not found`,
          )
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

      const recipeData = {
        recipeId: recipe.id,
        name: recipe.name,
        description: recipe.description,
        type: recipe.type,
        category: recipe.category,
        machine: machinePayloadId,
        ingredients,
        outputs,
        rarity: parseInt(recipe.rarity, 10) || 0,
        craftTime: parseInt(recipe.craftTime, 10) || 0,
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
