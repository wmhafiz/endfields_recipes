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
import Link from 'next/link'

import { ItemNode, type ItemNodeData } from './ItemNode'
import { FacilityNode } from './FacilityNode'
import { ChainControls } from './ChainControls'
import { useProductionChain } from './useProductionChain'
import { ImageOrPlaceholder } from '../ImageOrPlaceholder'
import type { EnrichedDbData, EnrichedItem } from '../../types/recipes'

const nodeTypes = {
  item: ItemNode,
  facility: FacilityNode,
}

interface ProductionChainProps {
  itemSlug: string
  data: EnrichedDbData
  item: EnrichedItem
}

export function ProductionChain({ itemSlug, data, item }: ProductionChainProps) {
  const router = useRouter()

  // State for controls
  const [depthLimit, setDepthLimit] = useState<number | undefined>(undefined)
  const [selectedRecipes, setSelectedRecipes] = useState<Map<string, number>>(new Map())
  const [collapsedNodeIds, setCollapsedNodeIds] = useState<Set<string>>(new Set())
  const [controlsCollapsed, setControlsCollapsed] = useState(false)

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
    itemId: item.itemId,
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

  return (
    <div className="chain-fullscreen">
      {/* Header overlay with back link and item info */}
      <div className="chain-header-overlay">
        <Link href="/" className="chain-back-link">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Back to Items
        </Link>
        <div className="chain-item-badge">
          <ImageOrPlaceholder
            imagePath={item.imageUrl}
            alt={item.itemName}
            width={28}
            height={28}
            className="chain-item-badge-img"
          />
          <span>{item.itemName}</span>
        </div>
      </div>

      {/* Full-screen React Flow canvas */}
      <div className="chain-canvas">
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

      {/* Bottom bar with controls */}
      {controlsCollapsed ? (
        <div className="chain-controls-collapsed">
          <button
            className="chain-controls-expand-btn"
            onClick={() => setControlsCollapsed(false)}
            aria-label="Show controls"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 15l-6-6-6 6" />
            </svg>
            Controls
          </button>
        </div>
      ) : (
        <div className="chain-bottom-bar">
          <div className="chain-bottom-header">
            <span className="chain-bottom-title">Chain Controls</span>
            <button
              className="chain-controls-collapse-btn"
              onClick={() => setControlsCollapsed(true)}
              aria-label="Hide controls"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
          </div>
          <div className="chain-bottom-content">
            <ChainControls
              depthLimit={depthLimit}
              onDepthChange={handleDepthChange}
              hasMultipleRecipes={hasMultipleRecipes}
              selectedRecipes={selectedRecipes}
              onRecipeChange={handleRecipeChange}
              data={data}
            />
          </div>
        </div>
      )}
    </div>
  )
}
