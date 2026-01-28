import { notFound } from 'next/navigation'
import Link from 'next/link'

import dbData from '@/data/db.json'
import { ItemHeader } from '../../components/ItemHeader'
import { ProductionChain } from '../../components/ProductionChain'
import { ImageOrPlaceholder } from '../../components/ImageOrPlaceholder'
import type { EnrichedDbData, EnrichedItem } from '../../types/recipes'

interface ItemPageProps {
  params: Promise<{ slug: string }>
}

export default async function ItemPage({ params }: ItemPageProps) {
  const { slug } = await params
  const data = dbData as EnrichedDbData

  // Build lookup maps
  const itemsBySlug = new Map<string, EnrichedItem>()
  const itemsById = new Map<string, EnrichedItem>()
  for (const item of data.items) {
    itemsBySlug.set(item.slug, item)
    itemsById.set(item.itemId, item)
  }

  // Find the item by slug
  const item = itemsBySlug.get(slug)

  if (!item) {
    notFound()
  }

  // Find recipes that produce this item (by itemId)
  const producedByRecipes = data.recipes.filter((r) =>
    r.outputs.some((o) => o.itemId === item.itemId),
  )

  // Find recipes that use this item as input
  const usedInRecipes = data.recipes.filter((r) =>
    r.ingredients.some((i) => i.itemId === item.itemId),
  )

  // Check if this is a raw material
  const isRawMaterial = item.isRawMaterial

  return (
    <div className="item-detail-container">
      <ItemHeader id={item.itemId} name={item.itemName} imagePath={item.localImagePath} />

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
            <ProductionChain itemSlug={item.slug} data={data} />
          )}
        </section>

        {/* Produced By Section */}
        {producedByRecipes.length > 0 && (
          <section className="item-detail-section">
            <h2 className="section-title">Produced By</h2>
            <div className="recipe-cards">
              {producedByRecipes.map((recipe) => {
                const craftTime = Number(recipe.craftTime)
                return (
                  <div key={recipe.id} className="detail-recipe-card">
                    <div className="recipe-inputs">
                      <span className="recipe-label">Inputs</span>
                      <div className="recipe-items">
                        {recipe.ingredients.map((ingredient, i) => {
                          const ingredientItem = itemsById.get(ingredient.itemId)
                          return (
                            <Link
                              key={i}
                              href={ingredientItem ? `/items/${ingredientItem.slug}` : '#'}
                              className="recipe-item-link"
                            >
                              <ImageOrPlaceholder
                                imagePath={ingredientItem?.localImagePath}
                                alt={ingredient.itemName}
                                width={32}
                                height={32}
                                className="recipe-item-img"
                              />
                              <span>{ingredient.itemName}</span>
                              {ingredient.count > 1 && (
                                <span className="quantity-badge">×{ingredient.count}</span>
                              )}
                            </Link>
                          )
                        })}
                      </div>
                    </div>

                    <div className="recipe-arrow">→</div>

                    <div className="recipe-facility">
                      <span className="recipe-label">Machine</span>
                      <div className="recipe-facility-info">
                        <span>{recipe.machineName}</span>
                        {craftTime > 0 && <span className="recipe-time">⏱ {craftTime}s</span>}
                      </div>
                    </div>

                    <div className="recipe-arrow">→</div>

                    <div className="recipe-output">
                      <span className="recipe-label">Output</span>
                      <div className="recipe-output-info">
                        <ImageOrPlaceholder
                          imagePath={item.localImagePath}
                          alt={item.itemName}
                          width={32}
                          height={32}
                          className="recipe-item-img"
                        />
                        <span>{item.itemName}</span>
                        {recipe.outputs[0]?.count > 1 && (
                          <span className="quantity-badge">×{recipe.outputs[0].count}</span>
                        )}
                      </div>
                    </div>
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
              {usedInRecipes.map((recipe) => {
                const craftTime = Number(recipe.craftTime)
                const primaryOutput = recipe.outputs[0]
                const outputItem = primaryOutput ? itemsById.get(primaryOutput.itemId) : undefined
                return (
                  <div key={recipe.id} className="detail-recipe-card">
                    <div className="recipe-inputs">
                      <span className="recipe-label">Inputs</span>
                      <div className="recipe-items">
                        {recipe.ingredients.map((ingredient, i) => {
                          const ingredientItem = itemsById.get(ingredient.itemId)
                          const isCurrentItem = ingredient.itemId === item.itemId
                          return (
                            <Link
                              key={i}
                              href={ingredientItem ? `/items/${ingredientItem.slug}` : '#'}
                              className={`recipe-item-link ${isCurrentItem ? 'highlighted' : ''}`}
                            >
                              <ImageOrPlaceholder
                                imagePath={ingredientItem?.localImagePath}
                                alt={ingredient.itemName}
                                width={32}
                                height={32}
                                className="recipe-item-img"
                              />
                              <span>{ingredient.itemName}</span>
                              {ingredient.count > 1 && (
                                <span className="quantity-badge">×{ingredient.count}</span>
                              )}
                            </Link>
                          )
                        })}
                      </div>
                    </div>

                    <div className="recipe-arrow">→</div>

                    <div className="recipe-facility">
                      <span className="recipe-label">Machine</span>
                      <div className="recipe-facility-info">
                        <span>{recipe.machineName}</span>
                        {craftTime > 0 && <span className="recipe-time">⏱ {craftTime}s</span>}
                      </div>
                    </div>

                    <div className="recipe-arrow">→</div>

                    <div className="recipe-output">
                      <span className="recipe-label">Output</span>
                      <Link
                        href={outputItem ? `/items/${outputItem.slug}` : '#'}
                        className="recipe-output-link"
                      >
                        <ImageOrPlaceholder
                          imagePath={outputItem?.localImagePath}
                          alt={primaryOutput?.itemName || recipe.name}
                          width={32}
                          height={32}
                          className="recipe-item-img"
                        />
                        <span>{primaryOutput?.itemName || recipe.name}</span>
                        {primaryOutput && primaryOutput.count > 1 && (
                          <span className="quantity-badge">×{primaryOutput.count}</span>
                        )}
                      </Link>
                    </div>
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
