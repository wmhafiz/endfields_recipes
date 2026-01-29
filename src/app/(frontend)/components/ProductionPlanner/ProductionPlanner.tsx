'use client'

import React, { useState } from 'react'

import type { EnrichedDbData } from '../../types/recipes'
import { BottomTargetsBar } from './BottomTargetsBar'
import { InspectorPanel } from './InspectorPanel'
import { ItemSidebar } from './ItemSidebar'
import { PlannerCanvas } from './PlannerCanvas'
import { computePlan } from './computePlan'
import type {
  ComputedPlan,
  PlannerLayoutOrientation,
  PlannerSettings,
  PlanTarget,
} from './plannerTypes'

interface ProductionPlannerProps {
  data: EnrichedDbData
}

export function ProductionPlanner({ data }: ProductionPlannerProps) {
  const [inspectedItemId, setInspectedItemId] = useState<string | null>(null)
  const [targets, setTargets] = useState<PlanTarget[]>([])
  const [settings, setSettings] = useState<PlannerSettings>({
    ratioMode: 'fractional',
    maxDepth: 10,
    layout: 'horizontal',
  })
  const [computedPlan, setComputedPlan] = useState<ComputedPlan | null>(null)
  const [canvasLayout, setCanvasLayout] = useState<PlannerLayoutOrientation>('horizontal')
  const [isRightCollapsed, setIsRightCollapsed] = useState(false)

  const handleAddTarget = ({ itemId, recipeId }: { itemId: string; recipeId: string }) => {
    setTargets((prev) => {
      const existing = prev.find((t) => t.itemId === itemId)
      if (existing) {
        return prev.map((t) => (t.itemId === itemId ? { ...t, recipeId } : t))
      }
      return [...prev, { itemId, recipeId, qtyPerMin: 1 }]
    })
  }

  const handleUpdateTarget = (itemId: string, patch: Partial<PlanTarget>) => {
    setTargets((prev) => prev.map((t) => (t.itemId === itemId ? { ...t, ...patch } : t)))
  }

  const handleRemoveTarget = (itemId: string) => {
    setTargets((prev) => prev.filter((t) => t.itemId !== itemId))
  }

  const handleClearTargets = () => {
    setTargets([])
  }

  const handleUpdateSettings = (patch: Partial<PlannerSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }))
  }

  const handleBuild = () => {
    const next = computePlan({ data, targets, settings })
    setComputedPlan(next)
    setCanvasLayout(next.settings.layout)
  }

  const handleAddTargetForItemId = (itemId: string) => {
    // If it's already a target, just focus it in the inspector
    if (targets.some((t) => t.itemId === itemId)) {
      setInspectedItemId(itemId)
      return
    }

    const producingRecipes = data.recipes.filter((r) => r.outputs.some((o) => o.itemId === itemId))
    if (producingRecipes.length === 0) {
      // Raw / uncraftable items: still allow inspection, but don't add to plan
      setInspectedItemId(itemId)
      return
    }

    // Default behavior for multiple producing recipes: choose the lowest sortId (then allow user to override)
    let chosen = producingRecipes[0]
    for (const r of producingRecipes) {
      const rSort = Number(r.sortId)
      const chosenSort = Number(chosen.sortId)
      if (Number.isFinite(rSort) && (!Number.isFinite(chosenSort) || rSort < chosenSort)) {
        chosen = r
      }
    }

    handleAddTarget({ itemId, recipeId: chosen.id })
    setInspectedItemId(itemId)
  }

  return (
    <div className="planner-page">
      <ItemSidebar
        data={data}
        inspectedItemId={inspectedItemId}
        onInspectItemId={setInspectedItemId}
      />

      <PlannerCanvas
        data={data}
        plan={computedPlan}
        layout={canvasLayout}
        onInspectItemId={setInspectedItemId}
        onDropItemId={handleAddTargetForItemId}
      />

      {isRightCollapsed ? (
        <div className="planner-right-collapsed">
          <button
            type="button"
            className="planner-sidebar-collapsed-btn"
            aria-label="Expand inspector"
            onClick={() => setIsRightCollapsed(false)}
            title="Inspector"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
            </svg>
          </button>
        </div>
      ) : (
        <aside className="planner-right">
          <div className="planner-right-header">
            <span className="planner-right-header-title">Inspector</span>
            <button
              type="button"
              className="planner-icon-btn"
              aria-label="Collapse inspector"
              onClick={() => setIsRightCollapsed(true)}
            >
              »
            </button>
          </div>
          <div className="planner-right-scroll">
            <InspectorPanel
              data={data}
              inspectedItemId={inspectedItemId}
              onAddTarget={handleAddTarget}
            />
          </div>
        </aside>
      )}

      <BottomTargetsBar
        data={data}
        targets={targets}
        settings={settings}
        hasBuiltPlan={Boolean(computedPlan)}
        canvasLayout={canvasLayout}
        onUpdateCanvasLayout={setCanvasLayout}
        onUpdateTarget={handleUpdateTarget}
        onRemoveTarget={handleRemoveTarget}
        onClearTargets={handleClearTargets}
        onUpdateSettings={handleUpdateSettings}
        onBuild={handleBuild}
      />
    </div>
  )
}
