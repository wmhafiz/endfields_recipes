'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import Image from 'next/image'

export interface ItemNodeData {
  itemName: string
  imagePath: string
  isRawMaterial: boolean
  hiddenDescendants?: number
  onToggleCollapse?: (nodeId: string) => void
  hasInputs: boolean
}

function ItemNodeComponent({ id, data }: NodeProps<{ data: ItemNodeData }>) {
  const nodeData = data as unknown as ItemNodeData

  const handleCollapseClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    nodeData.onToggleCollapse?.(id)
  }

  return (
    <div className={`item-node ${nodeData.isRawMaterial ? 'raw-material' : ''}`}>
      <Handle type="target" position={Position.Left} className="item-node-handle" />

      <div className="item-node-content">
        <div className="item-node-image-wrapper">
          <Image
            src={nodeData.imagePath}
            alt={nodeData.itemName}
            width={48}
            height={48}
            className="item-node-image"
          />
          {nodeData.isRawMaterial && <span className="raw-material-badge">RAW</span>}
        </div>
        <span className="item-node-name">{nodeData.itemName}</span>

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
