'use client'

import { useMemo } from 'react'
import type { Node, Edge } from '@xyflow/react'
import dagre from 'dagre'
import {
  buildProductionChain,
  filterCollapsedNodes,
  findRecipesForOutputById,
  findRecipesForChain,
  type EnrichedDbData,
  type EnrichedItem,
  type ChainNode,
  type ChainEdge,
} from '../../utils/buildProductionChain'
import type { ItemNodeData } from './ItemNode'
import type { FacilityNodeData } from './FacilityNode'

const NODE_WIDTH = 180
const NODE_HEIGHT = 80
const FACILITY_NODE_WIDTH = 160
const FACILITY_NODE_HEIGHT = 60

interface UseProductionChainOptions {
  itemId: string
  data: EnrichedDbData
  selectedRecipes: Map<string, number>
  collapsedNodeIds: Set<string>
  maxDepth?: number
  onToggleCollapse: (nodeId: string) => void
}

interface UseProductionChainResult {
  nodes: Node[]
  edges: Edge[]
  hasMultipleRecipes: Map<string, number> // itemId -> recipe count
}

/**
 * Normalize image path/URL for use in Next.js Image component.
 * Handles both legacy local paths and media URLs.
 */
function normalizeImagePath(imagePath: string): string {
  // If it's already a full URL (starts with http/https), use as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }
  // For local paths, ensure leading slash
  if (imagePath.startsWith('/')) return imagePath
  if (imagePath.startsWith('./')) return imagePath.replace('./', '/')
  return `/${imagePath}`
}

function applyDagreLayout(nodes: Node[], edges: Edge[]): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: 'LR', nodesep: 50, ranksep: 80 })

  nodes.forEach((node) => {
    const width = node.type === 'facility' ? FACILITY_NODE_WIDTH : NODE_WIDTH
    const height = node.type === 'facility' ? FACILITY_NODE_HEIGHT : NODE_HEIGHT
    g.setNode(node.id, { width, height })
  })

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target)
  })

  dagre.layout(g)

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = g.node(node.id)
    const width = node.type === 'facility' ? FACILITY_NODE_WIDTH : NODE_WIDTH
    const height = node.type === 'facility' ? FACILITY_NODE_HEIGHT : NODE_HEIGHT

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

export function useProductionChain({
  itemId,
  data,
  selectedRecipes,
  collapsedNodeIds,
  maxDepth,
  onToggleCollapse,
}: UseProductionChainOptions): UseProductionChainResult {
  return useMemo(() => {
    // Build item lookup for recipe filtering
    const itemsById = new Map<string, EnrichedItem>()
    for (const item of data.items) {
      itemsById.set(item.itemId, item)
    }

    // Build the raw chain using itemId for identity
    const chain = buildProductionChain(itemId, data, selectedRecipes, maxDepth)

    // Apply collapse filtering
    const { nodes: filteredChainNodes, edges: filteredChainEdges } = filterCollapsedNodes(
      chain.nodes,
      chain.edges,
      collapsedNodeIds,
    )

    // Track items with multiple machine recipes (by itemId)
    // Note: We count all recipes (including manual) so user knows alternatives exist
    const hasMultipleRecipes = new Map<string, number>()
    for (const node of chain.nodes) {
      if (node.type === 'item' && node.itemId) {
        const recipeCount = findRecipesForOutputById(node.itemId, data.recipes).length
        if (recipeCount > 1) {
          hasMultipleRecipes.set(node.itemId, recipeCount)
        }
      }
    }

    // Convert to React Flow nodes
    const reactFlowNodes: Node[] = filteredChainNodes.map((chainNode: ChainNode) => {
      if (chainNode.type === 'item') {
        // Check for machine recipes (not manual) - items with only manual recipes are terminal
        const hasInputs = findRecipesForChain(chainNode.itemId!, data.recipes, itemsById).length > 0

        const nodeData: ItemNodeData = {
          itemId: chainNode.itemId!,
          itemName: chainNode.itemName!,
          itemSlug: chainNode.itemSlug,
          imagePath: chainNode.imageUrl ? normalizeImagePath(chainNode.imageUrl) : undefined,
          isRawMaterial: chainNode.isRawMaterial,
          hiddenDescendants: chainNode.hiddenDescendants,
          onToggleCollapse,
          hasInputs,
          quantity: chainNode.quantity,
        }

        return {
          id: chainNode.id,
          type: 'item',
          position: { x: 0, y: 0 },
          data: nodeData,
        }
      } else {
        const nodeData: FacilityNodeData = {
          facilityName: chainNode.facilityName!,
          imagePath: chainNode.facilityImageUrl
            ? normalizeImagePath(chainNode.facilityImageUrl)
            : undefined,
          processingTime: chainNode.processingTime,
        }

        return {
          id: chainNode.id,
          type: 'facility',
          position: { x: 0, y: 0 },
          data: nodeData,
        }
      }
    })

    const reactFlowEdges: Edge[] = filteredChainEdges.map((chainEdge: ChainEdge) => ({
      id: chainEdge.id,
      source: chainEdge.source,
      target: chainEdge.target,
      type: 'smoothstep',
      animated: false,
      style: { stroke: '#6366f1', strokeWidth: 2 },
    }))

    // Apply layout
    const { nodes: layoutedNodes, edges: layoutedEdges } = applyDagreLayout(
      reactFlowNodes,
      reactFlowEdges,
    )

    return {
      nodes: layoutedNodes,
      edges: layoutedEdges,
      hasMultipleRecipes,
    }
  }, [itemId, data, selectedRecipes, collapsedNodeIds, maxDepth, onToggleCollapse])
}
