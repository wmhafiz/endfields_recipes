import Link from 'next/link'
import { ImageOrPlaceholder } from './ImageOrPlaceholder'
import type { Facility, Recipe, Item } from '../types/recipes'

interface FacilityCardProps {
  facility: Facility
  recipes: Recipe[]
  itemsByName: Map<string, Item>
}

export function FacilityCard({ facility, recipes, itemsByName }: FacilityCardProps) {
  return (
    <div className="facility-card">
      <div className="facility-card-header">
        <div className="facility-card-image">
          <ImageOrPlaceholder
            imagePath={facility.localImagePath}
            alt={facility.name}
            width={64}
            height={64}
            className="facility-image"
          />
        </div>
        <div className="facility-card-info">
          <h3 className="facility-card-name">{facility.name}</h3>
          <span className="facility-card-category">{facility.category}</span>
          {facility.processingTime != null && facility.processingTime > 0 && (
            <span className="facility-card-time">⏱ {facility.processingTime}s</span>
          )}
        </div>
      </div>

      {facility.description && (
        <p className="facility-card-description">{facility.description}</p>
      )}

      {recipes.length > 0 && (
        <div className="facility-card-recipes">
          <h4 className="facility-card-recipes-title">Recipes ({recipes.length})</h4>
          <div className="facility-card-recipes-list">
            {recipes.map((recipe, index) => {
              const outputItem = itemsByName.get(recipe.output)
              return (
                <div key={index} className="facility-recipe-item">
                  <div className="facility-recipe-inputs">
                    {recipe.inputs.map((input, i) => {
                      const inputItem = itemsByName.get(input.item)
                      return (
                        <Link
                          key={i}
                          href={inputItem ? `/items/${inputItem.id}` : '#'}
                          className="facility-recipe-link"
                          title={input.item}
                        >
                          <ImageOrPlaceholder
                            imagePath={inputItem?.localImagePath}
                            alt={input.item}
                            width={24}
                            height={24}
                          />
                          {input.quantity > 1 && (
                            <span className="facility-recipe-qty">×{input.quantity}</span>
                          )}
                        </Link>
                      )
                    })}
                  </div>
                  <span className="facility-recipe-arrow">→</span>
                  <Link
                    href={outputItem ? `/items/${outputItem.id}` : '#'}
                    className="facility-recipe-output"
                    title={recipe.output}
                  >
                    <ImageOrPlaceholder
                      imagePath={outputItem?.localImagePath}
                      alt={recipe.output}
                      width={24}
                      height={24}
                    />
                    <span className="facility-recipe-output-name">{recipe.output}</span>
                    {recipe.outputQuantity && recipe.outputQuantity > 1 && (
                      <span className="facility-recipe-qty">×{recipe.outputQuantity}</span>
                    )}
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {recipes.length === 0 && (
        <p className="facility-card-no-recipes">No recipes</p>
      )}
    </div>
  )
}
