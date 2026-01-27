import { notFound } from 'next/navigation'
import Link from 'next/link'

import recipesData from '@/data/recipes.json'
import { ItemHeader } from '../../components/ItemHeader'
import { ProductionChain } from '../../components/ProductionChain'
import { ImageOrPlaceholder } from '../../components/ImageOrPlaceholder'
import type { RecipesData } from '../../types/recipes'

interface ItemPageProps {
  params: Promise<{ id: string }>
}

export default async function ItemPage({ params }: ItemPageProps) {
  const { id } = await params
  const data = recipesData as RecipesData

  // Find the item by ID
  const item = data.items.find((i) => i.id === id)

  if (!item) {
    notFound()
  }

  // Find recipes that produce this item
  const producedByRecipes = data.recipes.filter((r) => r.output === item.name)

  // Find recipes that use this item as input (now with quantified inputs)
  const usedInRecipes = data.recipes.filter((r) => r.inputs.some((i) => i.item === item.name))

  // Check if this is a raw material (no recipe produces it)
  const isRawMaterial = producedByRecipes.length === 0

  // Get facility and item lookup maps
  const facilitiesByName = new Map(data.facilities.map((f) => [f.name, f]))
  const itemsByName = new Map(data.items.map((i) => [i.name, i]))

  return (
    <div className="item-detail-container">
      <ItemHeader id={item.id} name={item.name} imagePath={item.localImagePath} />

      <main className="item-detail-content">
        {/* Production Chain Section */}
        <section className="item-detail-section">
          <h2 className="section-title">Production Chain</h2>
          {isRawMaterial ? (
            <div className="raw-material-notice">
              <div className="raw-material-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <p>This is a raw material with no crafting recipe.</p>
            </div>
          ) : (
            <ProductionChain itemName={item.name} data={data} />
          )}
        </section>

        {/* Produced By Section */}
        {producedByRecipes.length > 0 && (
          <section className="item-detail-section">
            <h2 className="section-title">Produced By</h2>
            <div className="recipe-cards">
              {producedByRecipes.map((recipe, index) => {
                const facility = facilitiesByName.get(recipe.facility)
                const facilityTime = facility?.processingTime
                return (
                  <div key={index} className="detail-recipe-card">
                    <div className="recipe-inputs">
                      <span className="recipe-label">Inputs</span>
                      <div className="recipe-items">
                        {recipe.inputs.map((input, i) => {
                          const inputItem = itemsByName.get(input.item)
                          return (
                            <Link
                              key={i}
                              href={inputItem ? `/items/${inputItem.id}` : '#'}
                              className="recipe-item-link"
                            >
                              <ImageOrPlaceholder
                                imagePath={inputItem?.localImagePath}
                                alt={input.item}
                                width={32}
                                height={32}
                                className="recipe-item-img"
                              />
                              <span>{input.item}</span>
                              {input.quantity > 1 && (
                                <span className="quantity-badge">×{input.quantity}</span>
                              )}
                            </Link>
                          )
                        })}
                      </div>
                    </div>

                    <div className="recipe-arrow">→</div>

                    <div className="recipe-facility">
                      <span className="recipe-label">Facility</span>
                      <div className="recipe-facility-info">
                        <ImageOrPlaceholder
                          imagePath={facility?.localImagePath}
                          alt={recipe.facility}
                          width={32}
                          height={32}
                          className="recipe-facility-img"
                        />
                        <span>{recipe.facility}</span>
                        {facilityTime != null && facilityTime > 0 && (
                          <span className="recipe-time">⏱ {facilityTime}s</span>
                        )}
                      </div>
                    </div>

                    <div className="recipe-arrow">→</div>

                    <div className="recipe-output">
                      <span className="recipe-label">Output</span>
                      <div className="recipe-output-info">
                        <ImageOrPlaceholder
                          imagePath={item.localImagePath}
                          alt={item.name}
                          width={32}
                          height={32}
                          className="recipe-item-img"
                        />
                        <span>{item.name}</span>
                        {recipe.outputQuantity && recipe.outputQuantity > 1 && (
                          <span className="quantity-badge">×{recipe.outputQuantity}</span>
                        )}
                      </div>
                    </div>

                    {recipe.notes && (
                      <div className="recipe-notes">
                        <span className="recipe-notes-text">{recipe.notes}</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Used In Section */}
        <section className="item-detail-section">
          <h2 className="section-title">Used In</h2>
          {usedInRecipes.length === 0 ? (
            <p className="no-recipes-text">This item is not used in any recipes.</p>
          ) : (
            <div className="recipe-cards">
              {usedInRecipes.map((recipe, index) => {
                const facility = facilitiesByName.get(recipe.facility)
                const facilityTime = facility?.processingTime
                const outputItem = itemsByName.get(recipe.output)
                return (
                  <div key={index} className="detail-recipe-card">
                    <div className="recipe-inputs">
                      <span className="recipe-label">Inputs</span>
                      <div className="recipe-items">
                        {recipe.inputs.map((input, i) => {
                          const inputItem = itemsByName.get(input.item)
                          const isCurrentItem = input.item === item.name
                          return (
                            <Link
                              key={i}
                              href={inputItem ? `/items/${inputItem.id}` : '#'}
                              className={`recipe-item-link ${isCurrentItem ? 'highlighted' : ''}`}
                            >
                              <ImageOrPlaceholder
                                imagePath={inputItem?.localImagePath}
                                alt={input.item}
                                width={32}
                                height={32}
                                className="recipe-item-img"
                              />
                              <span>{input.item}</span>
                              {input.quantity > 1 && (
                                <span className="quantity-badge">×{input.quantity}</span>
                              )}
                            </Link>
                          )
                        })}
                      </div>
                    </div>

                    <div className="recipe-arrow">→</div>

                    <div className="recipe-facility">
                      <span className="recipe-label">Facility</span>
                      <div className="recipe-facility-info">
                        <ImageOrPlaceholder
                          imagePath={facility?.localImagePath}
                          alt={recipe.facility}
                          width={32}
                          height={32}
                          className="recipe-facility-img"
                        />
                        <span>{recipe.facility}</span>
                        {facilityTime != null && facilityTime > 0 && (
                          <span className="recipe-time">⏱ {facilityTime}s</span>
                        )}
                      </div>
                    </div>

                    <div className="recipe-arrow">→</div>

                    <div className="recipe-output">
                      <span className="recipe-label">Output</span>
                      <Link
                        href={outputItem ? `/items/${outputItem.id}` : '#'}
                        className="recipe-output-link"
                      >
                        <ImageOrPlaceholder
                          imagePath={outputItem?.localImagePath}
                          alt={recipe.output}
                          width={32}
                          height={32}
                          className="recipe-item-img"
                        />
                        <span>{recipe.output}</span>
                        {recipe.outputQuantity && recipe.outputQuantity > 1 && (
                          <span className="quantity-badge">×{recipe.outputQuantity}</span>
                        )}
                      </Link>
                    </div>

                    {recipe.notes && (
                      <div className="recipe-notes">
                        <span className="recipe-notes-text">{recipe.notes}</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
