'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Background,
  BackgroundVariant,
  Controls,
  type Edge,
  type Node,
  ReactFlow,
  type NodeMouseHandler,
  type ReactFlowInstance,
  useEdgesState,
  useNodesState,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import type { EnrichedDbData } from '../../types/recipes'
import { FacilityNode } from '../ProductionChain/FacilityNode'
import { ItemNode } from '../ProductionChain/ItemNode'
import { buildPlannerGraph } from './buildPlannerGraph'
import { getDraggedItemId } from './dnd'
import type { ComputedPlan, PlannerLayoutOrientation } from './plannerTypes'

const nodeTypes = {
  item: ItemNode,
  facility: FacilityNode,
}

interface PlannerCanvasProps {
  data: EnrichedDbData
  plan: ComputedPlan | null
  layout: PlannerLayoutOrientation
  onInspectItemId: (itemId: string) => void
  onDropItemId: (itemId: string) => void
}

export function PlannerCanvas({
  data,
  plan,
  layout,
  onInspectItemId,
  onDropItemId,
}: PlannerCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [rf, setRf] = useState<ReactFlowInstance | null>(null)

  useEffect(() => {
    if (!plan) {
      setNodes([])
      setEdges([])
      return
    }

    const next = buildPlannerGraph({ data, plan, layout })
    setNodes(next.nodes)
    setEdges(next.edges)

    // Fit view after nodes apply
    setTimeout(() => {
      rf?.fitView({ padding: 0.2 })
    }, 0)
  }, [data, layout, plan, rf, setEdges, setNodes])

  const handleNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      if (
        node.type === 'item' &&
        node.data &&
        typeof (node.data as { itemId?: unknown }).itemId === 'string'
      ) {
        onInspectItemId((node.data as { itemId: string }).itemId)
      }
    },
    [onInspectItemId],
  )

  const handleCanvasDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }, [])

  const handleCanvasDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const itemId = getDraggedItemId(e.dataTransfer)
      if (itemId) onDropItemId(itemId)
    },
    [onDropItemId],
  )

  const bottleneckNodes = useMemo(() => {
    return nodes.filter((n) => {
      if (n.type !== 'item') return false
      const data = n.data as { isBottleneck?: unknown }
      return data?.isBottleneck === true
    })
  }, [nodes])

  const handleFocusBottlenecks = useCallback(() => {
    if (!rf || bottleneckNodes.length === 0) return
    void rf.fitView({ nodes: bottleneckNodes, padding: 0.4, duration: 400 })
  }, [bottleneckNodes, rf])

  if (!plan) {
    return (
      <section
        className="planner-canvas"
        aria-label="Planner canvas"
        onDragOver={handleCanvasDragOver}
        onDrop={handleCanvasDrop}
      >
        <div className="planner-canvas-empty">
          <div className="planner-canvas-empty-title">Production Planner</div>
          <div className="planner-canvas-empty-subtitle">
            Drag an item from the sidebar onto the canvas, or click an item to inspect recipes and
            add a target.
            <div className="planner-canvas-steps">
              Next: <strong>Select item</strong> → <strong>Add to plan</strong> →{' '}
              <strong>Set qty/min</strong> → <strong>Build production line</strong>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section
      className="planner-canvas"
      aria-label="Planner canvas"
      onDragOver={handleCanvasDragOver}
      onDrop={handleCanvasDrop}
    >
      <div className="planner-canvas-flow">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          nodeTypes={nodeTypes}
          onInit={setRf}
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

      {bottleneckNodes.length > 0 && (
        <div className="planner-canvas-overlay">
          <button
            type="button"
            className="planner-secondary-btn"
            onClick={handleFocusBottlenecks}
            aria-label="Focus bottleneck nodes"
          >
            Focus bottleneck ({bottleneckNodes.length})
          </button>
        </div>
      )}
    </section>
  )
}
