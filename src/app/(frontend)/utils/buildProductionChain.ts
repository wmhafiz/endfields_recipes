export interface Item {
  id: string
  name: string
  localImagePath: string
}

export interface Facility {
  id: string
  name: string
  localImagePath: string
}

export interface Recipe {
  inputs: string[]
  facility: string
  output: string
  processingTime: number
}

export interface RecipesData {
  totalItems: number
  items: Item[]
  facilities: Facility[]
  recipes: Recipe[]
}

export interface ChainNode {
  id: string
  type: 'item' | 'facility'
  itemName?: string
  facilityName?: string
  isRawMaterial: boolean
  processingTime?: number
  recipe?: Recipe
  hiddenDescendants?: number
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
 * Find all recipes that produce a given output
 */
export function findRecipesForOutput(output: string, recipes: Recipe[]): Recipe[] {
  return recipes.filter((recipe) => recipe.output === output)
}

/**
 * Find the first recipe that produces a given output (for default selection)
 */
export function findRecipeForOutput(output: string, recipes: Recipe[]): Recipe | undefined {
  return recipes.find((recipe) => recipe.output === output)
}

/**
 * Build a production chain for an item
 * @param itemName - The name of the item to build the chain for
 * @param data - The recipes data
 * @param selectedRecipes - Map of item name to selected recipe index (for items with multiple recipes)
 * @param maxDepth - Maximum depth to traverse (undefined = no limit)
 * @returns ProductionChain with nodes and edges
 */
export function buildProductionChain(
  itemName: string,
  data: RecipesData,
  selectedRecipes: Map<string, number> = new Map(),
  maxDepth?: number,
): ProductionChain {
  const nodes: ChainNode[] = []
  const edges: ChainEdge[] = []
  const visited = new Set<string>()
  let nodeIdCounter = 0

  function generateNodeId(): string {
    return `node-${nodeIdCounter++}`
  }

  function buildChainRecursive(
    currentItemName: string,
    depth: number,
  ): { nodeId: string; descendantCount: number } | null {
    // Cycle detection
    if (visited.has(currentItemName)) {
      return null
    }

    // Depth limiting
    if (maxDepth !== undefined && depth > maxDepth) {
      return null
    }

    visited.add(currentItemName)

    const availableRecipes = findRecipesForOutput(currentItemName, data.recipes)
    const selectedIndex = selectedRecipes.get(currentItemName) ?? 0
    const recipe = availableRecipes[selectedIndex] ?? availableRecipes[0]

    const itemNodeId = generateNodeId()
    const isRawMaterial = !recipe

    // Create item node
    nodes.push({
      id: itemNodeId,
      type: 'item',
      itemName: currentItemName,
      isRawMaterial,
      recipe,
    })

    if (!recipe) {
      // Raw material - no further dependencies
      visited.delete(currentItemName)
      return { nodeId: itemNodeId, descendantCount: 0 }
    }

    // Create facility node
    const facilityNodeId = generateNodeId()
    nodes.push({
      id: facilityNodeId,
      type: 'facility',
      facilityName: recipe.facility,
      isRawMaterial: false,
      processingTime: recipe.processingTime,
      recipe,
    })

    // Edge from facility to item (facility produces item)
    edges.push({
      id: `edge-${facilityNodeId}-${itemNodeId}`,
      source: facilityNodeId,
      target: itemNodeId,
    })

    let totalDescendants = 1 // Count the facility node

    // Process each input
    for (const input of recipe.inputs) {
      const inputResult = buildChainRecursive(input, depth + 1)

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

    visited.delete(currentItemName)
    return { nodeId: itemNodeId, descendantCount: totalDescendants }
  }

  const result = buildChainRecursive(itemName, 0)

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
