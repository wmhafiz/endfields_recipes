'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ImageOrPlaceholder } from './ImageOrPlaceholder'
import type { EnrichedItem, EnrichedRecipe } from '../types/recipes'

interface ItemDetailSidebarProps {
  item: EnrichedItem
  producedByRecipes: EnrichedRecipe[]
  usedInRecipes: EnrichedRecipe[]
  itemsById: Map<string, EnrichedItem>
}

export function ItemDetailSidebar({
  item,
  producedByRecipes,
  usedInRecipes,
  itemsById,
}: ItemDetailSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  if (isCollapsed) {
    return (
      <div className="item-sidebar-collapsed">
        <button
          className="item-sidebar-toggle-btn"
          onClick={() => setIsCollapsed(false)}
          aria-label="Expand sidebar"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      </div>
    )
  }

  return (
    <aside className="item-sidebar">
      <div className="item-sidebar-header">
        <div className="item-sidebar-title">
          <ImageOrPlaceholder
            imagePath={item.imageUrl}
            alt={item.itemName}
            width={32}
            height={32}
            className="item-sidebar-img"
          />
          <span className="item-sidebar-name">{item.itemName}</span>
        </div>
        <button
          className="item-sidebar-toggle-btn"
          onClick={() => setIsCollapsed(true)}
          aria-label="Collapse sidebar"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      <div className="item-sidebar-scroll">
        {/* Produced By Section */}
        {producedByRecipes.length > 0 && (
          <section className="item-sidebar-section">
            <h3 className="item-sidebar-section-title">Produced By</h3>
            <div className="item-sidebar-recipes">
              {producedByRecipes.map((recipe) => {
                const craftTime = recipe.machineCraftTime
                return (
                  <div key={recipe.id} className="sidebar-recipe-card">
                    <div className="sidebar-recipe-header">
                      <span className="sidebar-recipe-machine">{recipe.machineName}</span>
                      {craftTime > 0 && (
                        <span className="sidebar-recipe-time">⏱ {craftTime / 1000}s</span>
                      )}
                    </div>
                    <div className="sidebar-recipe-flow">
                      <div className="sidebar-recipe-inputs">
                        {recipe.ingredients.map((ingredient, i) => {
                          const ingredientItem = itemsById.get(ingredient.itemId)
                          return (
                            <Link
                              key={i}
                              href={ingredientItem ? `/items/${ingredientItem.slug}` : '#'}
                              className="sidebar-recipe-item"
                            >
                              <ImageOrPlaceholder
                                imagePath={ingredientItem?.imageUrl}
                                alt={ingredient.itemName}
                                width={24}
                                height={24}
                                className="sidebar-recipe-item-img"
                              />
                              {ingredient.count > 1 && (
                                <span className="sidebar-qty">×{ingredient.count}</span>
                              )}
                            </Link>
                          )
                        })}
                      </div>
                      <span className="sidebar-recipe-arrow">→</span>
                      <div className="sidebar-recipe-output">
                        <ImageOrPlaceholder
                          imagePath={item.imageUrl}
                          alt={item.itemName}
                          width={24}
                          height={24}
                          className="sidebar-recipe-item-img"
                        />
                        {recipe.outputs[0]?.count > 1 && (
                          <span className="sidebar-qty">×{recipe.outputs[0].count}</span>
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
        <section className="item-sidebar-section">
          <h3 className="item-sidebar-section-title">Used In</h3>
          {usedInRecipes.length === 0 ? (
            <p className="sidebar-empty-text">This item is not used in any recipes.</p>
          ) : (
            <div className="item-sidebar-recipes">
              {usedInRecipes.map((recipe) => {
                const craftTime = recipe.machineCraftTime
                const primaryOutput = recipe.outputs[0]
                const outputItem = primaryOutput ? itemsById.get(primaryOutput.itemId) : undefined
                return (
                  <div key={recipe.id} className="sidebar-recipe-card">
                    <div className="sidebar-recipe-header">
                      <span className="sidebar-recipe-machine">{recipe.machineName}</span>
                      {craftTime > 0 && (
                        <span className="sidebar-recipe-time">⏱ {craftTime / 1000}s</span>
                      )}
                    </div>
                    <div className="sidebar-recipe-flow">
                      <div className="sidebar-recipe-inputs">
                        {recipe.ingredients.map((ingredient, i) => {
                          const ingredientItem = itemsById.get(ingredient.itemId)
                          const isCurrentItem = ingredient.itemId === item.itemId
                          return (
                            <Link
                              key={i}
                              href={ingredientItem ? `/items/${ingredientItem.slug}` : '#'}
                              className={`sidebar-recipe-item ${isCurrentItem ? 'highlighted' : ''}`}
                            >
                              <ImageOrPlaceholder
                                imagePath={ingredientItem?.imageUrl}
                                alt={ingredient.itemName}
                                width={24}
                                height={24}
                                className="sidebar-recipe-item-img"
                              />
                              {ingredient.count > 1 && (
                                <span className="sidebar-qty">×{ingredient.count}</span>
                              )}
                            </Link>
                          )
                        })}
                      </div>
                      <span className="sidebar-recipe-arrow">→</span>
                      <Link
                        href={outputItem ? `/items/${outputItem.slug}` : '#'}
                        className="sidebar-recipe-output-link"
                      >
                        <ImageOrPlaceholder
                          imagePath={outputItem?.imageUrl}
                          alt={primaryOutput?.itemName || recipe.name}
                          width={24}
                          height={24}
                          className="sidebar-recipe-item-img"
                        />
                        <span className="sidebar-output-name">
                          {primaryOutput?.itemName || recipe.name}
                        </span>
                        {primaryOutput && primaryOutput.count > 1 && (
                          <span className="sidebar-qty">×{primaryOutput.count}</span>
                        )}
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </aside>
  )
}
