'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'
import { ImageOrPlaceholder } from '../ImageOrPlaceholder'

export interface ItemNodeData extends Record<string, unknown> {
  itemId: string
  itemName: string
  itemSlug?: string
  imagePath?: string
  isRawMaterial: boolean
  hiddenDescendants?: number
  onToggleCollapse?: (nodeId: string) => void
  hasInputs: boolean
  quantity?: number
  // Planner-only (optional) overlay fields
  neededPerMin?: number
  yieldPerMin?: number
  isBottleneck?: boolean
}

export type ItemNodeType = Node<ItemNodeData, 'item'>

function ItemNodeComponent({ id, data }: NodeProps<ItemNodeType>) {
  const nodeData = data

  const handleCollapseClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    nodeData.onToggleCollapse?.(id)
  }

  return (
    <div
      className={`item-node ${nodeData.isRawMaterial ? 'raw-material' : ''} ${
        nodeData.isBottleneck ? 'bottleneck' : ''
      }`}
    >
      <Handle type="target" position={Position.Left} className="item-node-handle" />

      <div className="item-node-content">
        <div className="item-node-image-wrapper">
          <ImageOrPlaceholder
            imagePath={nodeData.imagePath}
            alt={nodeData.itemName}
            width={48}
            height={48}
            className="item-node-image"
          />
          {nodeData.isRawMaterial && <span className="raw-material-badge">RAW</span>}
          {nodeData.quantity && nodeData.quantity > 1 && (
            <span className="quantity-badge">×{nodeData.quantity}</span>
          )}
        </div>
        <span className="item-node-name">{nodeData.itemName}</span>

        {(typeof nodeData.neededPerMin === 'number' || nodeData.yieldPerMin != null) && (
          <div className="item-node-rates">
            <div className="item-node-rate-row">
              <span className="item-node-rate-label">need</span>
              <span className="item-node-rate-value">
                {typeof nodeData.neededPerMin === 'number'
                  ? `${nodeData.neededPerMin.toFixed(2)}/m`
                  : '—'}
              </span>
            </div>
            <div className="item-node-rate-row">
              <span className="item-node-rate-label">yield</span>
              <span className="item-node-rate-value">
                {typeof nodeData.yieldPerMin === 'number'
                  ? `${nodeData.yieldPerMin.toFixed(2)}/m`
                  : 'unknown'}
              </span>
            </div>
          </div>
        )}

        {nodeData.hasInputs && !nodeData.isRawMaterial && (
          <button
            className="item-node-collapse-btn"
            onClick={handleCollapseClick}
            aria-label={nodeData.hiddenDescendants ? 'Expand branch' : 'Collapse branch'}
          >
            {nodeData.hiddenDescendants ? `+${nodeData.hiddenDescendants}` : '−'}
          </button>
        )}
      </div>

      <Handle type="source" position={Position.Right} className="item-node-handle" />
    </div>
  )
}

export const ItemNode = memo(ItemNodeComponent)
