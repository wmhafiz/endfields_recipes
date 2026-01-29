import type { Edge, Node } from '@xyflow/react'
import dagre from 'dagre'

import type { EnrichedDbData, EnrichedItem, EnrichedRecipe } from '../../types/recipes'
import type { FacilityNodeData } from '../ProductionChain/FacilityNode'
import type { ItemNodeData } from '../ProductionChain/ItemNode'
import type { ComputedPlan, PlannerLayoutOrientation } from './plannerTypes'

const ITEM_NODE_WIDTH = 180
const ITEM_NODE_HEIGHT = 80
const FACILITY_NODE_WIDTH = 160
const FACILITY_NODE_HEIGHT = 60

function getItemNodeId(itemId: string): string {
  return `item:${itemId}`
}

function getRecipeNodeId(recipeId: string): string {
  return `recipe:${recipeId}`
}

function applyDagreLayout(args: {
  nodes: Node[]
  edges: Edge[]
  layout: PlannerLayoutOrientation
}): { nodes: Node[]; edges: Edge[] } {
  const { nodes, edges, layout } = args
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({
    rankdir: layout === 'vertical' ? 'TB' : 'LR',
    nodesep: 50,
    ranksep: 80,
  })

  nodes.forEach((node) => {
    const width = node.type === 'facility' ? FACILITY_NODE_WIDTH : ITEM_NODE_WIDTH
    const height = node.type === 'facility' ? FACILITY_NODE_HEIGHT : ITEM_NODE_HEIGHT
    g.setNode(node.id, { width, height })
  })

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target)
  })

  dagre.layout(g)

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = g.node(node.id)
    const width = node.type === 'facility' ? FACILITY_NODE_WIDTH : ITEM_NODE_WIDTH
    const height = node.type === 'facility' ? FACILITY_NODE_HEIGHT : ITEM_NODE_HEIGHT

    return {
      ...node,
      position: {
        x: nodeWithPosition.x - width / 2,
        y: nodeWithPosition.y - height / 2,
      },
    }
  })

  return { nodes: layoutedNodes, edges }
}

export function buildPlannerGraph(args: {
  data: EnrichedDbData
  plan: ComputedPlan
  layout: PlannerLayoutOrientation
}): { nodes: Node[]; edges: Edge[] } {
  const { data, plan, layout } = args

  const itemsById = new Map<string, EnrichedItem>()
  for (const item of data.items) itemsById.set(item.itemId, item)

  const recipesById = new Map<string, EnrichedRecipe>()
  for (const recipe of data.recipes) recipesById.set(recipe.id, recipe)

  const nodes: Node[] = []
  const edges: Edge[] = []

  // Item nodes (stable ids keyed by itemId)
  for (const itemId of Object.keys(plan.items)) {
    const item = itemsById.get(itemId)
    const throughput = plan.items[itemId]

    const nodeData: ItemNodeData = {
      itemId,
      itemName: item?.itemName ?? itemId,
      itemSlug: item?.slug,
      imagePath: item?.imageUrl,
      isRawMaterial: item?.isRawMaterial ?? false,
      hasInputs: false, // planner does not use collapse/expand
      // Planner extras (ignored by ItemNode unless implemented)
      neededPerMin: throughput.neededPerMin,
      yieldPerMin: throughput.yieldPerMin,
      isBottleneck: throughput.isBottleneck,
    }

    nodes.push({
      id: getItemNodeId(itemId),
      type: 'item',
      position: { x: 0, y: 0 },
      data: nodeData,
    })
  }

  // Facility nodes (stable ids keyed by recipe.id)
  for (const recipeId of Object.keys(plan.steps)) {
    const recipe = recipesById.get(recipeId)
    if (!recipe) continue
    const step = plan.steps[recipeId]
    const craftTimeSeconds =
      recipe.machineCraftTime > 0 ? recipe.machineCraftTime / 1000 : undefined

    const nodeData: FacilityNodeData = {
      facilityName: recipe.machineName,
      imagePath: recipe.machineImageUrl,
      processingTime: craftTimeSeconds,
      // Planner extras (ignored by FacilityNode unless implemented)
      recipeId,
      machines: step.machines,
      craftsPerMin: step.craftsPerMin,
    }

    nodes.push({
      id: getRecipeNodeId(recipeId),
      type: 'facility',
      position: { x: 0, y: 0 },
      data: nodeData,
    })
  }

  // Edges: ingredients -> facility, facility -> chosen output items
  for (const recipeId of Object.keys(plan.steps)) {
    const recipe = recipesById.get(recipeId)
    if (!recipe) continue

    const facilityNodeId = getRecipeNodeId(recipeId)

    // Inputs
    for (const ing of recipe.ingredients) {
      const source = getItemNodeId(ing.itemId)
      const target = facilityNodeId
      const highlight = plan.items[ing.itemId]?.isBottleneck === true
      edges.push({
        id: `edge:${source}->${target}`,
        source,
        target,
        type: 'smoothstep',
        animated: highlight,
        style: { stroke: highlight ? '#ef4444' : '#6366f1', strokeWidth: 2 },
      })
    }

    // Outputs relied on by this plan for this recipe
    const outputItemIds = plan.recipeToOutputItemIds[recipeId] ?? []
    for (const itemId of outputItemIds) {
      const source = facilityNodeId
      const target = getItemNodeId(itemId)
      const highlight = plan.items[itemId]?.isBottleneck === true
      edges.push({
        id: `edge:${source}->${target}`,
        source,
        target,
        type: 'smoothstep',
        animated: highlight,
        style: { stroke: highlight ? '#ef4444' : '#6366f1', strokeWidth: 2 },
      })
    }
  }

  const { nodes: layoutedNodes, edges: layoutedEdges } = applyDagreLayout({ nodes, edges, layout })
  return { nodes: layoutedNodes, edges: layoutedEdges }
}
