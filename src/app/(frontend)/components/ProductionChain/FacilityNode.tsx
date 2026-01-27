'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'
import { ImageOrPlaceholder } from '../ImageOrPlaceholder'

export interface FacilityNodeData extends Record<string, unknown> {
  facilityName: string
  imagePath?: string
  processingTime?: number
}

export type FacilityNodeType = Node<FacilityNodeData, 'facility'>

function FacilityNodeComponent({ data }: NodeProps<FacilityNodeType>) {
  const nodeData = data

  return (
    <div className="facility-node">
      <Handle type="target" position={Position.Left} className="facility-node-handle" />

      <div className="facility-node-content">
        <div className="facility-node-image-wrapper">
          <ImageOrPlaceholder
            imagePath={nodeData.imagePath}
            alt={nodeData.facilityName}
            width={32}
            height={32}
            className="facility-node-image"
          />
        </div>
        <div className="facility-node-info">
          <span className="facility-node-name">{nodeData.facilityName}</span>
          {nodeData.processingTime != null && nodeData.processingTime > 0 && (
            <span className="facility-node-time">
              <span className="time-icon">⏱</span> {nodeData.processingTime}s
            </span>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Right} className="facility-node-handle" />
    </div>
  )
}

export const FacilityNode = memo(FacilityNodeComponent)
