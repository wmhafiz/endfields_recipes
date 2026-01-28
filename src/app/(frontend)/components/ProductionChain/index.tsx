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

import { ItemNode, type ItemNodeData } from './ItemNode'
import { FacilityNode } from './FacilityNode'
import { ChainControls } from './ChainControls'
import { useProductionChain } from './useProductionChain'
import type { EnrichedDbData } from '../../types/recipes'

const nodeTypes = {
  item: ItemNode,
  facility: FacilityNode,
}

interface ProductionChainProps {
  itemSlug: string
  data: EnrichedDbData
}

export function ProductionChain({ itemSlug, data }: ProductionChainProps) {
  const router = useRouter()

  // Find item by slug to get itemId
  const item = useMemo(() => {
    return data.items.find((i) => i.slug === itemSlug)
  }, [data.items, itemSlug])

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

  // Build the production chain using itemId
  const {
    nodes: initialNodes,
    edges: initialEdges,
    hasMultipleRecipes,
  } = useProductionChain({
    itemId: item?.itemId ?? '',
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

  // Handle node click - navigate to item page using slug
  const handleNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      if (node.type === 'item' && node.data) {
        const nodeData = node.data as ItemNodeData
        if (nodeData.itemSlug) {
          router.push(`/items/${nodeData.itemSlug}`)
        }
      }
    },
    [router],
  )

  // Handle recipe selection (using itemId as key)
  const handleRecipeChange = useCallback((itemIdKey: string, recipeIndex: number) => {
    setSelectedRecipes((prev) => {
      const next = new Map(prev)
      next.set(itemIdKey, recipeIndex)
      return next
    })
  }, [])

  // Handle depth limit change
  const handleDepthChange = useCallback((newDepth: number | undefined) => {
    setDepthLimit(newDepth)
  }, [])

  if (!item) {
    return <p className="no-recipes-text">Item not found.</p>
  }

  return (
    <div className="production-chain-container">
      <ChainControls
        depthLimit={depthLimit}
        onDepthChange={handleDepthChange}
        hasMultipleRecipes={hasMultipleRecipes}
        selectedRecipes={selectedRecipes}
        onRecipeChange={handleRecipeChange}
        data={data}
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
