'use client'

import { useMemo } from 'react'
import type { Node, Edge } from '@xyflow/react'
import dagre from 'dagre'
import {
  buildProductionChain,
  filterCollapsedNodes,
  findRecipesForOutputById,
  type EnrichedDbData,
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

function getImagePath(localPath: string): string {
  if (localPath.startsWith('/')) return localPath
  if (localPath.startsWith('./')) return localPath.replace('./', '/')
  return `/${localPath}`
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
    // Build the raw chain using itemId for identity
    const chain = buildProductionChain(itemId, data, selectedRecipes, maxDepth)

    // Apply collapse filtering
    const { nodes: filteredChainNodes, edges: filteredChainEdges } = filterCollapsedNodes(
      chain.nodes,
      chain.edges,
      collapsedNodeIds,
    )

    // Track items with multiple recipes (by itemId)
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
        const hasInputs = findRecipesForOutputById(chainNode.itemId!, data.recipes).length > 0

        const nodeData: ItemNodeData = {
          itemId: chainNode.itemId!,
          itemName: chainNode.itemName!,
          itemSlug: chainNode.itemSlug,
          imagePath: chainNode.localImagePath ? getImagePath(chainNode.localImagePath) : undefined,
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
          imagePath: chainNode.facilityImagePath
            ? getImagePath(chainNode.facilityImagePath)
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
