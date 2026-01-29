'use client'

import React, { useMemo, useState } from 'react'

import type { EnrichedDbData, EnrichedItem, EnrichedRecipe } from '../../types/recipes'
import { ImageOrPlaceholder } from '../ImageOrPlaceholder'
import type {
  PlannerLayoutOrientation,
  PlannerSettings,
  PlanTarget,
  RatioMode,
} from './plannerTypes'

interface BottomTargetsBarProps {
  data: EnrichedDbData
  targets: PlanTarget[]
  settings: PlannerSettings
  hasBuiltPlan: boolean
  canvasLayout: PlannerLayoutOrientation
  onUpdateCanvasLayout: (layout: PlannerLayoutOrientation) => void
  onUpdateTarget: (itemId: string, patch: Partial<PlanTarget>) => void
  onRemoveTarget: (itemId: string) => void
  onClearTargets: () => void
  onUpdateSettings: (patch: Partial<PlannerSettings>) => void
  onBuild: () => void
}

export function BottomTargetsBar({
  data,
  targets,
  settings,
  hasBuiltPlan,
  canvasLayout,
  onUpdateCanvasLayout,
  onUpdateTarget,
  onRemoveTarget,
  onClearTargets,
  onUpdateSettings,
  onBuild,
}: BottomTargetsBarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const itemsById = useMemo(() => {
    const map = new Map<string, EnrichedItem>()
    for (const item of data.items) map.set(item.itemId, item)
    return map
  }, [data.items])

  const recipesById = useMemo(() => {
    const map = new Map<string, EnrichedRecipe>()
    for (const recipe of data.recipes) map.set(recipe.id, recipe)
    return map
  }, [data.recipes])

  const totalTargetOutputPerMin = useMemo(() => {
    return targets.reduce((sum, t) => sum + (Number.isFinite(t.qtyPerMin) ? t.qtyPerMin : 0), 0)
  }, [targets])

  if (isCollapsed) {
    return (
      <div className="planner-bottom-collapsed">
        <button
          type="button"
          className="planner-sidebar-collapsed-btn"
          aria-label="Expand targets bar"
          onClick={() => setIsCollapsed(false)}
          title="Targets & Build"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z" />
          </svg>
          {targets.length > 0 && (
            <span className="planner-bottom-collapsed-badge">{targets.length}</span>
          )}
        </button>
      </div>
    )
  }

  return (
    <div className="planner-bottom-bar">
      <div className="planner-bottom-header">
        <div className="planner-bottom-title">
          Targets ({targets.length})
          {targets.length > 0 && (
            <span className="planner-bottom-subtitle">
              {' '}
              • {totalTargetOutputPerMin.toFixed(1)}/min
            </span>
          )}
        </div>
        <button
          type="button"
          className="planner-icon-btn"
          aria-label="Collapse targets bar"
          onClick={() => setIsCollapsed(true)}
        >
          ▼
        </button>
      </div>

      <div className="planner-bottom-content">
        {/* Targets list - horizontal scroll */}
        <div className="planner-bottom-targets">
          {targets.length === 0 ? (
            <div className="planner-bottom-empty">
              Add targets from the inspector or drop items on canvas
            </div>
          ) : (
            targets.map((t) => {
              const item = itemsById.get(t.itemId)
              const recipe = recipesById.get(t.recipeId)
              return (
                <div key={t.itemId} className="planner-bottom-target">
                  <ImageOrPlaceholder
                    imagePath={item?.imageUrl}
                    alt={item?.itemName || t.itemId}
                    width={28}
                    height={28}
                    className="planner-bottom-target-img"
                  />
                  <div className="planner-bottom-target-info">
                    <div className="planner-bottom-target-name">{item?.itemName || t.itemId}</div>
                    <div className="planner-bottom-target-recipe">
                      {recipe?.machineName || recipe?.name || ''}
                    </div>
                  </div>
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    value={Number.isFinite(t.qtyPerMin) ? t.qtyPerMin : 0}
                    onChange={(e) =>
                      onUpdateTarget(t.itemId, { qtyPerMin: Number(e.target.value) })
                    }
                    className="planner-bottom-target-input"
                    aria-label={`Qty/min for ${item?.itemName || t.itemId}`}
                  />
                  <button
                    type="button"
                    className="planner-bottom-target-remove"
                    onClick={() => onRemoveTarget(t.itemId)}
                    aria-label={`Remove ${item?.itemName || t.itemId}`}
                  >
                    ×
                  </button>
                </div>
              )
            })
          )}
        </div>

        {/* Settings & Actions */}
        <div className="planner-bottom-controls">
          <select
            className="planner-bottom-select"
            value={settings.ratioMode}
            onChange={(e) => onUpdateSettings({ ratioMode: e.target.value as RatioMode })}
            aria-label="Ratio mode"
          >
            <option value="fractional">Fractional</option>
            <option value="whole">Whole #</option>
          </select>

          <input
            className="planner-bottom-depth"
            type="number"
            min={0}
            step={1}
            value={settings.maxDepth ?? ''}
            onChange={(e) => {
              const v = e.target.value
              onUpdateSettings({ maxDepth: v === '' ? null : Number(v) })
            }}
            placeholder="Depth ∞"
            aria-label="Max depth"
            title="Max depth"
          />

          {hasBuiltPlan && (
            <select
              className="planner-bottom-select"
              value={canvasLayout}
              onChange={(e) => onUpdateCanvasLayout(e.target.value as PlannerLayoutOrientation)}
              aria-label="Layout"
            >
              <option value="horizontal">H Layout</option>
              <option value="vertical">V Layout</option>
            </select>
          )}

          {targets.length > 0 && (
            <button
              type="button"
              className="planner-bottom-clear"
              onClick={onClearTargets}
              aria-label="Clear all"
            >
              Clear
            </button>
          )}

          <button
            type="button"
            className="planner-bottom-build"
            onClick={onBuild}
            disabled={targets.length === 0}
            aria-label="Build production line"
          >
            Build
          </button>
        </div>
      </div>
    </div>
  )
}
