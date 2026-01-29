'use client'

import React, { useMemo, useState } from 'react'

import type { EnrichedDbData, EnrichedItem, EnrichedRecipe } from '../../types/recipes'
import { ImageOrPlaceholder } from '../ImageOrPlaceholder'

function formatCraftTime(ms: number): string {
  if (!ms || ms <= 0) return 'Unknown'
  const seconds = ms / 1000
  return seconds >= 60 ? `${Math.round(seconds / 60)}m` : `${seconds}s`
}

interface InspectorPanelProps {
  data: EnrichedDbData
  inspectedItemId: string | null
  onAddTarget?: (args: { itemId: string; recipeId: string }) => void
}

export function InspectorPanel({ data, inspectedItemId, onAddTarget }: InspectorPanelProps) {
  const [filterUsesRaw, setFilterUsesRaw] = useState(false)
  const [filterIngredientItemId, setFilterIngredientItemId] = useState('')

  const itemsById = useMemo(() => {
    const map = new Map<string, EnrichedItem>()
    for (const item of data.items) map.set(item.itemId, item)
    return map
  }, [data.items])

  const inspectedItem = inspectedItemId ? itemsById.get(inspectedItemId) : undefined

  const producingRecipesBase = useMemo(() => {
    if (!inspectedItemId) return []
    return data.recipes.filter((recipe) => recipe.outputs.some((o) => o.itemId === inspectedItemId))
  }, [data.recipes, inspectedItemId])

  const ingredientOptions = useMemo(() => {
    const ids = new Set<string>()
    const labelsById = new Map<string, string>()

    for (const recipe of producingRecipesBase) {
      for (const ing of recipe.ingredients) {
        ids.add(ing.itemId)
        const item = itemsById.get(ing.itemId)
        labelsById.set(ing.itemId, item?.itemName || ing.itemName || ing.itemId)
      }
    }

    const options = Array.from(ids).map((id) => ({
      id,
      label: labelsById.get(id) || id,
    }))
    options.sort((a, b) => a.label.localeCompare(b.label))
    return options
  }, [itemsById, producingRecipesBase])

  const producingRecipes = useMemo(() => {
    let recipes = producingRecipesBase
    if (filterUsesRaw) {
      recipes = recipes.filter((r) => r.usesRawMaterial === true)
    }
    if (filterIngredientItemId) {
      recipes = recipes.filter((r) =>
        r.ingredients.some((i) => i.itemId === filterIngredientItemId),
      )
    }
    return recipes
  }, [filterIngredientItemId, filterUsesRaw, producingRecipesBase])

  return (
    <div className="planner-right-section">
      <div className="planner-right-section-title">Inspector</div>

      {!inspectedItem ? (
        <div className="planner-empty-hint">Select an item to inspect details and recipes.</div>
      ) : (
        <div className="planner-inspector">
          <div className="planner-inspector-item-header">
            <ImageOrPlaceholder
              imagePath={inspectedItem.imageUrl}
              alt={inspectedItem.itemName}
              width={48}
              height={48}
              className="planner-inspector-item-img"
            />
            <div className="planner-inspector-item-meta">
              <div className="planner-inspector-item-name">{inspectedItem.itemName}</div>
              <div className="planner-inspector-item-sub">
                {inspectedItem.isRawMaterial ? 'Raw material' : 'Crafted item'}
                {inspectedItem.category ? ` • ${inspectedItem.category}` : ''}
              </div>
            </div>
          </div>

          {producingRecipesBase.length > 0 && (
            <div className="planner-inspector-filters">
              <label className="planner-checkbox">
                <input
                  type="checkbox"
                  checked={filterUsesRaw}
                  onChange={(e) => setFilterUsesRaw(e.target.checked)}
                />
                Uses raw materials
              </label>

              <label className="planner-select">
                <span className="planner-select-label">Has ingredient</span>
                <select
                  className="planner-select-input"
                  value={filterIngredientItemId}
                  onChange={(e) => setFilterIngredientItemId(e.target.value)}
                >
                  <option value="">Any</option>
                  {ingredientOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          {inspectedItem.isRawMaterial ? (
            <div className="planner-empty-hint">
              This is a raw material with no producing recipes.
            </div>
          ) : producingRecipes.length === 0 ? (
            <div className="planner-empty-hint">
              No producing recipes found
              {producingRecipesBase.length > 0 ? ' for the current filters' : ''}.
            </div>
          ) : (
            <div className="planner-recipe-list">
              {producingRecipes.map((recipe: EnrichedRecipe) => {
                const outputForItem = recipe.outputs.find((o) => o.itemId === inspectedItem.itemId)
                const outputCount = outputForItem?.count ?? 1
                return (
                  <div key={recipe.id} className="planner-recipe-row">
                    <div className="planner-recipe-row-main">
                      <div className="planner-recipe-row-title">
                        <div className="planner-recipe-row-name">{recipe.name}</div>
                        {recipe.usesRawMaterial && (
                          <span className="planner-badge planner-badge-raw">Raw</span>
                        )}
                      </div>

                      <div className="planner-recipe-row-meta">
                        <span className="planner-recipe-row-machine">{recipe.machineName}</span>
                        <span className="planner-recipe-row-sep">•</span>
                        <span className="planner-recipe-row-time">
                          ⏱ {formatCraftTime(recipe.machineCraftTime)}
                        </span>
                        <span className="planner-recipe-row-sep">•</span>
                        <span className="planner-recipe-row-output">×{outputCount} / craft</span>
                      </div>

                      <div className="planner-recipe-ingredients">
                        {recipe.ingredients.map((ing) => {
                          const ingItem = itemsById.get(ing.itemId)
                          return (
                            <div
                              key={`${recipe.id}:${ing.itemId}`}
                              className="planner-ingredient-pill"
                            >
                              <ImageOrPlaceholder
                                imagePath={ingItem?.imageUrl}
                                alt={ing.itemName}
                                width={18}
                                height={18}
                                className="planner-ingredient-img"
                              />
                              <span className="planner-ingredient-name">{ing.itemName}</span>
                              {ing.count > 1 && (
                                <span className="planner-ingredient-qty">×{ing.count}</span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    <div className="planner-recipe-row-actions">
                      <button
                        type="button"
                        className="planner-primary-btn"
                        onClick={() =>
                          onAddTarget?.({ itemId: inspectedItem.itemId, recipeId: recipe.id })
                        }
                        disabled={!onAddTarget}
                      >
                        Add to plan
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
