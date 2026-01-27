'use client'

import { useCallback, useState, useMemo } from 'react'
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  type NodeMouseHandler,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useRouter } from 'next/navigation'

import { ItemNode } from './ItemNode'
import { FacilityNode } from './FacilityNode'
import { ChainControls } from './ChainControls'
import { useProductionChain } from './useProductionChain'
import type { RecipesData } from '../../utils/buildProductionChain'

const nodeTypes = {
  item: ItemNode,
  facility: FacilityNode,
}

interface ProductionChainProps {
  itemName: string
  data: RecipesData
}

export function ProductionChain({ itemName, data }: ProductionChainProps) {
  const router = useRouter()

  // State for controls
  const [depthLimit, setDepthLimit] = useState<number | undefined>(undefined)
  const [selectedRecipes, setSelectedRecipes] = useState<Map<string, number>>(new Map())
  const [collapsedNodeIds, setCollapsedNodeIds] = useState<Set<string>>(new Set())

  // Toggle collapse handler
  const handleToggleCollapse = useCallback((nodeId: string) => {
    setCollapsedNodeIds((prev) => {
      const next = new Set(prev)
      if (next.has(nodeId)) {
        next.delete(nodeId)
      } else {
        next.add(nodeId)
      }
      return next
    })
  }, [])

  // Build the production chain
  const { nodes: initialNodes, edges: initialEdges, hasMultipleRecipes } = useProductionChain({
    itemName,
    data,
    selectedRecipes,
    collapsedNodeIds,
    maxDepth: depthLimit,
    onToggleCollapse: handleToggleCollapse,
  })

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // Update nodes/edges when chain changes
  useMemo(() => {
    setNodes(initialNodes)
    setEdges(initialEdges)
  }, [initialNodes, initialEdges, setNodes, setEdges])

  // Handle node click - navigate to item page
  const handleNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      if (node.type === 'item' && node.data) {
        const nodeData = node.data as { itemName?: string }
        if (nodeData.itemName) {
          // Find item ID by name
          const item = data.items.find((i) => i.name === nodeData.itemName)
          if (item) {
            router.push(`/items/${item.id}`)
          }
        }
      }
    },
    [data.items, router],
  )

  // Handle recipe selection
  const handleRecipeChange = useCallback((itemNameKey: string, recipeIndex: number) => {
    setSelectedRecipes((prev) => {
      const next = new Map(prev)
      next.set(itemNameKey, recipeIndex)
      return next
    })
  }, [])

  // Handle depth limit change
  const handleDepthChange = useCallback((newDepth: number | undefined) => {
    setDepthLimit(newDepth)
  }, [])

  return (
    <div className="production-chain-container">
      <ChainControls
        depthLimit={depthLimit}
        onDepthChange={handleDepthChange}
        hasMultipleRecipes={hasMultipleRecipes}
        selectedRecipes={selectedRecipes}
        onRecipeChange={handleRecipeChange}
        recipes={data.recipes}
      />

      <div className="production-chain-flow">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.1}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
        >
          <Controls showInteractive={false} />
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#2a2a3e" />
        </ReactFlow>
      </div>
    </div>
  )
}
