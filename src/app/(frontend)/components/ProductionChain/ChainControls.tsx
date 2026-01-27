'use client'

import type { Recipe } from '../../utils/buildProductionChain'

interface ChainControlsProps {
  depthLimit: number | undefined
  onDepthChange: (depth: number | undefined) => void
  hasMultipleRecipes: Map<string, number>
  selectedRecipes: Map<string, number>
  onRecipeChange: (itemName: string, recipeIndex: number) => void
  recipes: Recipe[]
}

export function ChainControls({
  depthLimit,
  onDepthChange,
  hasMultipleRecipes,
  selectedRecipes,
  onRecipeChange,
  recipes,
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
            {itemsWithMultipleRecipes.map(([itemName, count]) => {
              const itemRecipes = recipes.filter((r) => r.output === itemName)
              const selectedIndex = selectedRecipes.get(itemName) ?? 0

              return (
                <div key={itemName} className="chain-recipe-selector">
                  <span className="chain-recipe-item-name">{itemName}</span>
                  <select
                    value={selectedIndex}
                    onChange={(e) => onRecipeChange(itemName, parseInt(e.target.value, 10))}
                    className="chain-recipe-select"
                  >
                    {itemRecipes.map((recipe, index) => (
                      <option key={index} value={index}>
                        {recipe.inputs.join(' + ')} → {recipe.facility}
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
