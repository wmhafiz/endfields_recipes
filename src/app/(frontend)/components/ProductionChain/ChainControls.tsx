'use client'

import type { EnrichedDbData } from '../../types/recipes'
import { findRecipesForOutputById } from '../../utils/buildProductionChain'

interface ChainControlsProps {
  depthLimit: number | undefined
  onDepthChange: (depth: number | undefined) => void
  hasMultipleRecipes: Map<string, number> // itemId -> recipe count
  selectedRecipes: Map<string, number>
  onRecipeChange: (itemId: string, recipeIndex: number) => void
  data: EnrichedDbData
}

export function ChainControls({
  depthLimit,
  onDepthChange,
  hasMultipleRecipes,
  selectedRecipes,
  onRecipeChange,
  data,
}: ChainControlsProps) {
  const handleDepthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value === '' || value === '0') {
      onDepthChange(undefined)
    } else {
      const num = parseInt(value, 10)
      if (!isNaN(num) && num > 0) {
        onDepthChange(num)
      }
    }
  }

  // Build item lookup
  const itemsById = new Map(data.items.map((item) => [item.itemId, item]))

  const itemsWithMultipleRecipes = Array.from(hasMultipleRecipes.entries())

  return (
    <div className="chain-controls">
      <div className="chain-control-group">
        <label className="chain-control-label" htmlFor="depth-limit">
          Depth Limit
        </label>
        <input
          id="depth-limit"
          type="number"
          min="1"
          max="20"
          placeholder="No limit"
          value={depthLimit ?? ''}
          onChange={handleDepthChange}
          className="chain-control-input"
        />
      </div>

      {itemsWithMultipleRecipes.length > 0 && (
        <div className="chain-control-recipes">
          <span className="chain-control-label">Recipe Variants</span>
          <div className="chain-recipe-selectors">
            {itemsWithMultipleRecipes.map(([itemId, _count]) => {
              const item = itemsById.get(itemId)
              const itemRecipes = findRecipesForOutputById(itemId, data.recipes)
              const selectedIndex = selectedRecipes.get(itemId) ?? 0

              return (
                <div key={itemId} className="chain-recipe-selector">
                  <span className="chain-recipe-item-name">{item?.itemName ?? itemId}</span>
                  <select
                    value={selectedIndex}
                    onChange={(e) => onRecipeChange(itemId, parseInt(e.target.value, 10))}
                    className="chain-recipe-select"
                  >
                    {itemRecipes.map((recipe, index) => (
                      <option key={index} value={index}>
                        {recipe.ingredients.map((i) => i.itemName).join(' + ')} → {recipe.machineName}
                      </option>
                    ))}
                  </select>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
