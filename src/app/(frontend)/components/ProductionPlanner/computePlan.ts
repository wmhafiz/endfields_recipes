import type { EnrichedDbData, EnrichedItem, EnrichedRecipe } from '../../types/recipes'
import type {
  ComputedPlan,
  ItemThroughput,
  PlanTarget,
  PlannerSettings,
  RecipeStep,
} from './plannerTypes'

const MS_PER_MIN = 60_000
const NEAR_INT_EPS = 1e-6
const MAX_SCALE_FACTOR = 20

function isFinitePositive(n: number): boolean {
  return Number.isFinite(n) && n > 0
}

function isNearInteger(n: number): boolean {
  return Math.abs(n - Math.round(n)) < NEAR_INT_EPS
}

function chooseDefaultRecipe(recipes: EnrichedRecipe[]): EnrichedRecipe | null {
  if (recipes.length === 0) return null
  let best = recipes[0]
  let bestSort = Number(best.sortId)
  for (const r of recipes) {
    const sort = Number(r.sortId)
    if (Number.isFinite(sort) && (!Number.isFinite(bestSort) || sort < bestSort)) {
      best = r
      bestSort = sort
    }
  }
  return best
}

export function computePlan(args: {
  data: EnrichedDbData
  targets: PlanTarget[]
  settings: PlannerSettings
}): ComputedPlan {
  const { data, targets, settings } = args

  const itemsById = new Map<string, EnrichedItem>()
  for (const item of data.items) itemsById.set(item.itemId, item)

  const recipesById = new Map<string, EnrichedRecipe>()
  for (const recipe of data.recipes) recipesById.set(recipe.id, recipe)

  const recipesProducingItem = new Map<string, EnrichedRecipe[]>()
  for (const recipe of data.recipes) {
    for (const out of recipe.outputs) {
      const list = recipesProducingItem.get(out.itemId) ?? []
      list.push(recipe)
      recipesProducingItem.set(out.itemId, list)
    }
  }

  const targetRecipeByItemId = new Map<string, string>()
  for (const t of targets) {
    if (t.itemId && t.recipeId) {
      targetRecipeByItemId.set(t.itemId, t.recipeId)
    }
  }

  const neededPerMin = new Map<string, number>()
  const craftsPerMinByRecipe = new Map<string, number>()
  const itemToRecipeId = new Map<string, string | null>()

  const getSelectedRecipeForItem = (itemId: string): EnrichedRecipe | null => {
    const item = itemsById.get(itemId)
    if (item?.isRawMaterial) return null

    const forcedRecipeId = targetRecipeByItemId.get(itemId)
    if (forcedRecipeId) {
      const recipe = recipesById.get(forcedRecipeId) ?? null
      if (recipe && recipe.outputs.some((o) => o.itemId === itemId)) return recipe
      return null
    }

    const candidates = recipesProducingItem.get(itemId) ?? []
    const recipe = chooseDefaultRecipe(candidates)
    if (recipe && recipe.outputs.some((o) => o.itemId === itemId)) return recipe
    return null
  }

  const addNeeded = (itemId: string, deltaNeeded: number, depth: number, visiting: Set<string>) => {
    if (!isFinitePositive(deltaNeeded)) return
    if (visiting.has(itemId)) return

    const prevNeeded = neededPerMin.get(itemId) ?? 0
    const nextNeeded = prevNeeded + deltaNeeded
    neededPerMin.set(itemId, nextNeeded)

    if (settings.maxDepth !== null && depth > settings.maxDepth) {
      return
    }

    const item = itemsById.get(itemId)
    if (item?.isRawMaterial) {
      itemToRecipeId.set(itemId, null)
      return
    }

    const recipe = getSelectedRecipeForItem(itemId)
    if (!recipe) {
      itemToRecipeId.set(itemId, null)
      return
    }

    itemToRecipeId.set(itemId, recipe.id)

    const output = recipe.outputs.find((o) => o.itemId === itemId)
    const outputCount = output?.count ?? 0
    if (!isFinitePositive(outputCount)) return

    const craftsNeededForThisItem = nextNeeded / outputCount
    const prevCrafts = craftsPerMinByRecipe.get(recipe.id) ?? 0
    if (craftsNeededForThisItem <= prevCrafts + 1e-12) return

    const deltaCrafts = craftsNeededForThisItem - prevCrafts
    craftsPerMinByRecipe.set(recipe.id, craftsNeededForThisItem)

    const nextVisiting = new Set(visiting)
    nextVisiting.add(itemId)

    for (const ing of recipe.ingredients) {
      addNeeded(ing.itemId, deltaCrafts * ing.count, depth + 1, nextVisiting)
    }
  }

  // Seed requirements from configured targets
  for (const t of targets) {
    if (!t.itemId) continue
    const qty = Number(t.qtyPerMin)
    if (!isFinitePositive(qty)) continue
    addNeeded(t.itemId, qty, 0, new Set())
  }

  // Reverse mapping: recipe -> itemIds we rely on that recipe to produce
  const recipeToOutputItemIdsMap = new Map<string, Set<string>>()
  for (const [itemId, recipeId] of itemToRecipeId.entries()) {
    if (!recipeId) continue
    const set = recipeToOutputItemIdsMap.get(recipeId) ?? new Set<string>()
    set.add(itemId)
    recipeToOutputItemIdsMap.set(recipeId, set)
  }

  // Base steps (fractional, unscaled)
  const baseSteps = new Map<string, RecipeStep>()
  for (const [recipeId, craftsPerMin] of craftsPerMinByRecipe.entries()) {
    const recipe = recipesById.get(recipeId)
    const craftTimeMs = recipe?.machineCraftTime ?? 0
    const step: RecipeStep = {
      recipeId,
      craftsPerMin,
      craftTimeMs: craftTimeMs > 0 ? craftTimeMs : undefined,
    }
    if (craftTimeMs > 0) {
      step.machinesExact = (craftsPerMin * craftTimeMs) / MS_PER_MIN
    }
    baseSteps.set(recipeId, step)
  }

  // Determine whole-number scaling, if requested
  let scaleFactor = 1
  if (settings.ratioMode === 'whole') {
    const exactMachineCounts: number[] = []
    for (const step of baseSteps.values()) {
      if (typeof step.machinesExact === 'number' && Number.isFinite(step.machinesExact)) {
        exactMachineCounts.push(step.machinesExact)
      }
    }

    if (exactMachineCounts.length > 0) {
      for (let candidate = 1; candidate <= MAX_SCALE_FACTOR; candidate++) {
        if (exactMachineCounts.every((m) => isNearInteger(m * candidate))) {
          scaleFactor = candidate
          break
        }
      }
    }
  }

  const didScale = settings.ratioMode === 'whole' && scaleFactor > 1

  // Final steps + item throughput
  const steps: Record<string, RecipeStep> = {}
  for (const [recipeId, base] of baseSteps.entries()) {
    const craftsPerMin = didScale ? base.craftsPerMin * scaleFactor : base.craftsPerMin
    const craftTimeMs = base.craftTimeMs

    const next: RecipeStep = {
      recipeId,
      craftsPerMin,
      craftTimeMs,
    }

    if (craftTimeMs && craftTimeMs > 0) {
      const machinesExact = (craftsPerMin * craftTimeMs) / MS_PER_MIN
      next.machinesExact = machinesExact

      if (settings.ratioMode === 'fractional') {
        next.machines = machinesExact
      } else if (didScale) {
        next.machines = Math.max(0, Math.round(machinesExact))
      } else {
        // Fallback: round up per step (ensures >= needed)
        next.machines = Math.max(0, Math.ceil(machinesExact))
      }
    }

    steps[recipeId] = next
  }

  const items: Record<string, ItemThroughput> = {}

  for (const [itemId, baseNeeded] of neededPerMin.entries()) {
    const needed = didScale ? baseNeeded * scaleFactor : baseNeeded
    const recipeId = itemToRecipeId.get(itemId) ?? null

    let yieldPerMin: number | undefined = undefined
    if (recipeId) {
      const recipe = recipesById.get(recipeId)
      const step = steps[recipeId]
      const craftTimeMs = recipe?.machineCraftTime ?? 0
      const machines = step?.machines
      const outputCount = recipe?.outputs.find((o) => o.itemId === itemId)?.count ?? 0

      if (
        craftTimeMs > 0 &&
        typeof machines === 'number' &&
        Number.isFinite(machines) &&
        outputCount > 0
      ) {
        const craftsPerMinProduced = (machines * MS_PER_MIN) / craftTimeMs
        yieldPerMin = craftsPerMinProduced * outputCount
      }
    }

    const isBottleneck =
      typeof yieldPerMin === 'number' && Number.isFinite(yieldPerMin)
        ? yieldPerMin + 1e-9 < needed
        : false

    items[itemId] = { itemId, neededPerMin: needed, yieldPerMin, isBottleneck }
  }

  const recipeToOutputItemIds: Record<string, string[]> = {}
  for (const [recipeId, set] of recipeToOutputItemIdsMap.entries()) {
    recipeToOutputItemIds[recipeId] = Array.from(set)
  }

  const totalTargetOutputPerMin = targets.reduce((sum, t) => {
    const qty = Number(t.qtyPerMin)
    return sum + (Number.isFinite(qty) ? qty : 0)
  }, 0)

  return {
    targets,
    settings,
    stats: {
      totalTargetOutputPerMin,
      scaleFactor: settings.ratioMode === 'whole' ? scaleFactor : 1,
    },
    itemToRecipeId: Object.fromEntries(itemToRecipeId.entries()),
    recipeToOutputItemIds,
    items,
    steps,
  }
}
