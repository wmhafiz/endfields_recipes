// Import canonical types from shared types file
import type { EnrichedDbData, EnrichedRecipe, EnrichedItem } from '../types/recipes'

// Re-export enriched types for convenience
export type { EnrichedDbData, EnrichedRecipe, EnrichedItem }

export interface ChainNode {
  id: string
  type: 'item' | 'facility'
  itemId?: string
  itemName?: string
  itemSlug?: string
  facilityName?: string
  facilityImagePath?: string
  isRawMaterial: boolean
  processingTime?: number
  recipe?: EnrichedRecipe
  hiddenDescendants?: number
  quantity?: number
  localImagePath?: string
}

export interface ChainEdge {
  id: string
  source: string
  target: string
}

export interface ProductionChain {
  nodes: ChainNode[]
  edges: ChainEdge[]
  rootNodeId: string
}

/**
 * Find all recipes that produce a given output by itemId
 */
export function findRecipesForOutputById(
  itemId: string,
  recipes: EnrichedRecipe[],
): EnrichedRecipe[] {
  return recipes.filter((recipe) => recipe.outputs.some((o) => o.itemId === itemId))
}

/**
 * Find the first recipe that produces a given output (for default selection)
 */
export function findRecipeForOutputById(
  itemId: string,
  recipes: EnrichedRecipe[],
): EnrichedRecipe | undefined {
  return recipes.find((recipe) => recipe.outputs.some((o) => o.itemId === itemId))
}

/**
 * Build a production chain for an item using itemId for identity
 * @param itemId - The itemId of the item to build the chain for
 * @param data - The enriched recipes data
 * @param selectedRecipes - Map of itemId to selected recipe index (for items with multiple recipes)
 * @param maxDepth - Maximum depth to traverse (undefined = no limit)
 * @returns ProductionChain with nodes and edges
 */
export function buildProductionChain(
  itemId: string,
  data: EnrichedDbData,
  selectedRecipes: Map<string, number> = new Map(),
  maxDepth?: number,
): ProductionChain {
  const nodes: ChainNode[] = []
  const edges: ChainEdge[] = []
  const visited = new Set<string>()
  let nodeIdCounter = 0

  // Build item lookup
  const itemsById = new Map<string, EnrichedItem>()
  for (const item of data.items) {
    itemsById.set(item.itemId, item)
  }

  function generateNodeId(): string {
    return `node-${nodeIdCounter++}`
  }

  function buildChainRecursive(
    currentItemId: string,
    depth: number,
    quantity?: number,
  ): { nodeId: string; descendantCount: number } | null {
    // Cycle detection using itemId
    if (visited.has(currentItemId)) {
      return null
    }

    // Depth limiting
    if (maxDepth !== undefined && depth > maxDepth) {
      return null
    }

    visited.add(currentItemId)

    const item = itemsById.get(currentItemId)
    const availableRecipes = findRecipesForOutputById(currentItemId, data.recipes)
    const selectedIndex = selectedRecipes.get(currentItemId) ?? 0
    const recipe = availableRecipes[selectedIndex] ?? availableRecipes[0]

    const itemNodeId = generateNodeId()
    const isRawMaterial = item?.isRawMaterial ?? !recipe

    // Create item node with quantity info
    nodes.push({
      id: itemNodeId,
      type: 'item',
      itemId: currentItemId,
      itemName: item?.itemName ?? currentItemId,
      itemSlug: item?.slug,
      localImagePath: item?.localImagePath,
      isRawMaterial,
      recipe,
      quantity,
    })

    if (!recipe) {
      // Raw material - no further dependencies
      visited.delete(currentItemId)
      return { nodeId: itemNodeId, descendantCount: 0 }
    }

    // Create facility node
    const facilityNodeId = generateNodeId()
    const craftTime = Number(recipe.craftTime)
    nodes.push({
      id: facilityNodeId,
      type: 'facility',
      facilityName: recipe.machineName,
      facilityImagePath: recipe.machineImagePath,
      isRawMaterial: false,
      recipe,
      processingTime: craftTime > 0 ? craftTime : undefined,
    })

    // Edge from facility to item (facility produces item)
    edges.push({
      id: `edge-${facilityNodeId}-${itemNodeId}`,
      source: facilityNodeId,
      target: itemNodeId,
    })

    let totalDescendants = 1 // Count the facility node

    // Process each ingredient
    for (const ingredient of recipe.ingredients) {
      const inputResult = buildChainRecursive(ingredient.itemId, depth + 1, ingredient.count)

      if (inputResult) {
        // Edge from input item to facility
        edges.push({
          id: `edge-${inputResult.nodeId}-${facilityNodeId}`,
          source: inputResult.nodeId,
          target: facilityNodeId,
        })
        totalDescendants += 1 + inputResult.descendantCount
      }
    }

    visited.delete(currentItemId)
    return { nodeId: itemNodeId, descendantCount: totalDescendants }
  }

  const result = buildChainRecursive(itemId, 0)

  return {
    nodes,
    edges,
    rootNodeId: result?.nodeId ?? '',
  }
}

/**
 * Count total nodes in a subtree (for collapse badge)
 */
export function countDescendants(
  nodeId: string,
  edges: ChainEdge[],
  allNodes: ChainNode[],
): number {
  const nodeSet = new Set(allNodes.map((n) => n.id))
  let count = 0

  function countRecursive(currentNodeId: string, visited: Set<string>) {
    if (visited.has(currentNodeId)) return
    visited.add(currentNodeId)

    // Find all edges where this node is the target (incoming edges)
    const incomingEdges = edges.filter((e) => e.target === currentNodeId)

    for (const edge of incomingEdges) {
      if (nodeSet.has(edge.source)) {
        count++
        countRecursive(edge.source, visited)
      }
    }
  }

  countRecursive(nodeId, new Set())
  return count
}

/**
 * Get all node IDs in a subtree (for collapse/expand filtering)
 */
export function getSubtreeNodeIds(nodeId: string, edges: ChainEdge[]): Set<string> {
  const subtreeIds = new Set<string>()

  function collectRecursive(currentNodeId: string) {
    // Find all edges where this node is the target (incoming edges = ancestors)
    const incomingEdges = edges.filter((e) => e.target === currentNodeId)

    for (const edge of incomingEdges) {
      if (!subtreeIds.has(edge.source)) {
        subtreeIds.add(edge.source)
        collectRecursive(edge.source)
      }
    }
  }

  collectRecursive(nodeId)
  return subtreeIds
}

/**
 * Filter nodes and edges based on collapsed state
 */
export function filterCollapsedNodes(
  nodes: ChainNode[],
  edges: ChainEdge[],
  collapsedNodeIds: Set<string>,
): { nodes: ChainNode[]; edges: ChainEdge[] } {
  // Collect all hidden node IDs
  const hiddenNodeIds = new Set<string>()

  for (const collapsedId of collapsedNodeIds) {
    const subtreeIds = getSubtreeNodeIds(collapsedId, edges)
    for (const id of subtreeIds) {
      hiddenNodeIds.add(id)
    }
  }

  // Update collapsed nodes with descendant count
  const filteredNodes = nodes
    .filter((node) => !hiddenNodeIds.has(node.id))
    .map((node) => {
      if (collapsedNodeIds.has(node.id)) {
        const descendantCount = countDescendants(node.id, edges, nodes)
        return { ...node, hiddenDescendants: descendantCount }
      }
      return { ...node, hiddenDescendants: undefined }
    })

  // Filter edges - keep only edges between visible nodes
  const visibleNodeIds = new Set(filteredNodes.map((n) => n.id))
  const filteredEdges = edges.filter(
    (edge) => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target),
  )

  return { nodes: filteredNodes, edges: filteredEdges }
}
