export type RatioMode = 'fractional' | 'whole'

export type PlannerLayoutOrientation = 'horizontal' | 'vertical'

export interface PlanTarget {
  /** The output item being targeted */
  itemId: string
  /** The producing recipe chosen for this item */
  recipeId: string
  /** Desired output rate (qty per minute) */
  qtyPerMin: number
}

export interface PlannerSettings {
  ratioMode: RatioMode
  /**
   * Maximum dependency depth to traverse.
   * `null` means unlimited (use with care).
   */
  maxDepth: number | null
  /** Post-build canvas layout direction (applied via Dagre) */
  layout: PlannerLayoutOrientation
}

export interface ItemThroughput {
  itemId: string
  /** Required rate based on selected targets (qty per minute) */
  neededPerMin: number
  /** Produced rate based on computed machine counts (qty per minute) */
  yieldPerMin?: number
  /** True when yieldPerMin is known and less than neededPerMin */
  isBottleneck?: boolean
}

export interface RecipeStep {
  recipeId: string
  /** Crafts per minute needed for this recipe step */
  craftsPerMin: number
  /** Craft time in milliseconds (if known) */
  craftTimeMs?: number
  /** Exact machine count required (fractional) */
  machinesExact?: number
  /** Chosen machine count after ratio mode / rounding strategy */
  machines?: number
}

export interface PlannerStats {
  /** Sum of configured target outputs per minute */
  totalTargetOutputPerMin: number
  /** Scale factor applied in whole-number (multi-line) mode */
  scaleFactor: number
}

export interface ComputedPlan {
  targets: PlanTarget[]
  settings: PlannerSettings
  stats: PlannerStats
  /**
   * Selected producing recipe per item (null for raw materials / unknown).
   * Only includes items that were reached during computation.
   */
  itemToRecipeId: Record<string, string | null>
  /** Reverse mapping of recipe → the output itemIds this plan relies on that recipe for */
  recipeToOutputItemIds: Record<string, string[]>
  items: Record<string, ItemThroughput>
  steps: Record<string, RecipeStep>
}
