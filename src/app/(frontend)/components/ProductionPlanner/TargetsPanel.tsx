'use client'

import React, { useMemo } from 'react'

import type { EnrichedDbData, EnrichedItem, EnrichedRecipe } from '../../types/recipes'
import { ImageOrPlaceholder } from '../ImageOrPlaceholder'
import type {
  PlannerLayoutOrientation,
  PlannerSettings,
  PlanTarget,
  RatioMode,
} from './plannerTypes'

interface TargetsPanelProps {
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

export function TargetsPanel({
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
}: TargetsPanelProps) {
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

  return (
    <div className="planner-right-section">
      <div className="planner-right-section-title">Selected Targets</div>

      {targets.length === 0 ? (
        <div className="planner-empty-hint">
          Add one or more targets from the inspector (or by dropping items onto the canvas).
        </div>
      ) : (
        <>
          <div className="planner-targets-list">
            {targets.map((t) => {
              const item = itemsById.get(t.itemId)
              const recipe = recipesById.get(t.recipeId)
              return (
                <div key={t.itemId} className="planner-target-row">
                  <div className="planner-target-row-left">
                    <ImageOrPlaceholder
                      imagePath={item?.imageUrl}
                      alt={item?.itemName || t.itemId}
                      width={32}
                      height={32}
                      className="planner-target-img"
                    />
                    <div className="planner-target-meta">
                      <div className="planner-target-name">{item?.itemName || t.itemId}</div>
                      <div className="planner-target-sub">
                        {recipe?.name || t.recipeId}
                        {recipe?.machineName ? ` • ${recipe.machineName}` : ''}
                      </div>
                    </div>
                  </div>

                  <div className="planner-target-row-right">
                    <label className="planner-target-qty">
                      <span className="planner-target-qty-label">Qty/min</span>
                      <input
                        type="number"
                        min={0}
                        step={0.1}
                        value={Number.isFinite(t.qtyPerMin) ? t.qtyPerMin : 0}
                        onChange={(e) =>
                          onUpdateTarget(t.itemId, { qtyPerMin: Number(e.target.value) })
                        }
                        className="planner-target-qty-input"
                        aria-label={`Target qty per minute for ${item?.itemName || t.itemId}`}
                      />
                    </label>
                    <button
                      type="button"
                      className="planner-danger-btn"
                      onClick={() => onRemoveTarget(t.itemId)}
                      aria-label={`Remove ${item?.itemName || t.itemId} target`}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="planner-targets-actions">
            <button
              type="button"
              className="planner-secondary-btn"
              onClick={onClearTargets}
              aria-label="Clear all targets"
            >
              Clear all
            </button>
          </div>
        </>
      )}

      <div className="planner-settings">
        <div className="planner-settings-title">Settings</div>

        <div className="planner-settings-row">
          <label className="planner-select">
            <span className="planner-select-label">Ratio mode</span>
            <select
              className="planner-select-input"
              value={settings.ratioMode}
              onChange={(e) => onUpdateSettings({ ratioMode: e.target.value as RatioMode })}
              aria-label="Ratio mode"
            >
              <option value="fractional">Fractional machines</option>
              <option value="whole">Whole-number (multi-line)</option>
            </select>
          </label>

          <label className="planner-select">
            <span className="planner-select-label">Max depth</span>
            <input
              className="planner-select-input"
              type="number"
              min={0}
              step={1}
              value={settings.maxDepth ?? ''}
              onChange={(e) => {
                const v = e.target.value
                onUpdateSettings({ maxDepth: v === '' ? null : Number(v) })
              }}
              placeholder="∞"
              aria-label="Maximum dependency depth"
            />
          </label>
        </div>

        <div className="planner-summary">
          <div className="planner-summary-row">
            <span className="planner-summary-label">Targets</span>
            <span className="planner-summary-value">{targets.length}</span>
          </div>
          <div className="planner-summary-row">
            <span className="planner-summary-label">Total target output / min</span>
            <span className="planner-summary-value">{totalTargetOutputPerMin.toFixed(2)}</span>
          </div>
        </div>

        <div className="planner-build">
          <button
            type="button"
            className="planner-primary-btn"
            onClick={onBuild}
            disabled={targets.length === 0}
            aria-label="Build production line"
          >
            Build production line
          </button>
        </div>

        {hasBuiltPlan && (
          <div className="planner-post-build">
            <div className="planner-settings-title">Canvas</div>
            <div className="planner-settings-row">
              <label className="planner-select">
                <span className="planner-select-label">Layout</span>
                <select
                  className="planner-select-input"
                  value={canvasLayout}
                  onChange={(e) => onUpdateCanvasLayout(e.target.value as PlannerLayoutOrientation)}
                  aria-label="Canvas layout orientation"
                >
                  <option value="horizontal">Horizontal</option>
                  <option value="vertical">Vertical</option>
                </select>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
