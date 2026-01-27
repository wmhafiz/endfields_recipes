'use client'

import { useMemo } from 'react'
import type { Node, Edge } from '@xyflow/react'
import dagre from 'dagre'
import {
  buildProductionChain,
  filterCollapsedNodes,
  type RecipesData,
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
  itemName: string
  data: RecipesData
  selectedRecipes: Map<string, number>
  collapsedNodeIds: Set<string>
  maxDepth?: number
  onToggleCollapse: (nodeId: string) => void
}

interface UseProductionChainResult {
  nodes: Node[]
  edges: Edge[]
  hasMultipleRecipes: Map<string, number> // item name -> recipe count
}

function getImagePath(localPath: string): string {
  if (localPath.startsWith('/')) return localPath
  if (localPath.startsWith('./')) return localPath.replace('./', '/')
  return `/${localPath}`
}

function applyDagreLayout(
  nodes: Node[],
  edges: Edge[],
): { nodes: Node[]; edges: Edge[] } {
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
  itemName,
  data,
  selectedRecipes,
  collapsedNodeIds,
  maxDepth,
  onToggleCollapse,
}: UseProductionChainOptions): UseProductionChainResult {
  return useMemo(() => {
    // Build the raw chain
    const chain = buildProductionChain(itemName, data, selectedRecipes, maxDepth)

    // Apply collapse filtering
    const { nodes: filteredChainNodes, edges: filteredChainEdges } = filterCollapsedNodes(
      chain.nodes,
      chain.edges,
      collapsedNodeIds,
    )

    // Track items with multiple recipes
    const hasMultipleRecipes = new Map<string, number>()
    for (const node of chain.nodes) {
      if (node.type === 'item' && node.itemName) {
        const recipeCount = data.recipes.filter((r) => r.output === node.itemName).length
        if (recipeCount > 1) {
          hasMultipleRecipes.set(node.itemName, recipeCount)
        }
      }
    }

    // Convert to React Flow nodes
    const itemsByName = new Map(data.items.map((item) => [item.name, item]))
    const facilitiesByName = new Map(data.facilities.map((f) => [f.name, f]))

    const reactFlowNodes: Node[] = filteredChainNodes.map((chainNode: ChainNode) => {
      if (chainNode.type === 'item') {
        const item = itemsByName.get(chainNode.itemName!)
        const hasInputs = data.recipes.some((r) => r.output === chainNode.itemName)

        const nodeData: ItemNodeData = {
          itemName: chainNode.itemName!,
          imagePath: item ? getImagePath(item.localImagePath) : '/images/placeholder.png',
          isRawMaterial: chainNode.isRawMaterial,
          hiddenDescendants: chainNode.hiddenDescendants,
          onToggleCollapse,
          hasInputs,
        }

        return {
          id: chainNode.id,
          type: 'item',
          position: { x: 0, y: 0 },
          data: nodeData,
        }
      } else {
        const facility = facilitiesByName.get(chainNode.facilityName!)

        const nodeData: FacilityNodeData = {
          facilityName: chainNode.facilityName!,
          imagePath: facility ? getImagePath(facility.localImagePath) : '/images/placeholder.png',
          processingTime: chainNode.processingTime ?? 0,
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
  }, [itemName, data, selectedRecipes, collapsedNodeIds, maxDepth, onToggleCollapse])
}
