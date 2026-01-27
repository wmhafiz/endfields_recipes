'use client'

import Image from 'next/image'
import { useState, useMemo, useCallback } from 'react'

interface Item {
  id: string
  name: string
  localImagePath: string
}

interface Facility {
  id: string
  name: string
  localImagePath: string
}

interface Recipe {
  inputs: string[]
  facility: string
  output: string
}

interface RecipesData {
  totalItems: number
  items: Item[]
  facilities: Facility[]
  recipes: Recipe[]
}

interface ItemsDisplayProps {
  data: RecipesData
}

type ViewMode = 'grid' | 'list'

interface RelatedRecipes {
  usedIn: Recipe[]
  produces: Recipe[]
}

export function ItemsDisplay({ data }: ItemsDisplayProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return data.items
    const query = searchQuery.toLowerCase()
    return data.items.filter((item) => item.name.toLowerCase().includes(query))
  }, [data.items, searchQuery])

  const getImagePath = (localPath: string) => {
    // Convert images/ores/... to /images/ores/... (add leading slash for public folder)
    if (localPath.startsWith('/')) return localPath
    if (localPath.startsWith('./')) return localPath.replace('./', '/')
    return `/${localPath}`
  }

  // Lookup maps for items and facilities by name
  const itemsByName = useMemo(() => {
    const map = new Map<string, Item>()
    data.items.forEach((item) => map.set(item.name, item))
    return map
  }, [data.items])

  const facilitiesByName = useMemo(() => {
    const map = new Map<string, Facility>()
    data.facilities.forEach((facility) => map.set(facility.name, facility))
    return map
  }, [data.facilities])

  const getRelatedRecipes = useCallback(
    (item: Item): RelatedRecipes => {
      const usedIn = data.recipes.filter((recipe) => recipe.inputs.includes(item.name))
      const produces = data.recipes.filter((recipe) => recipe.output === item.name)
      return { usedIn, produces }
    },
    [data.recipes],
  )

  const relatedRecipes = useMemo(() => {
    if (!selectedItem) return null
    return getRelatedRecipes(selectedItem)
  }, [selectedItem, getRelatedRecipes])

  const handleItemClick = (item: Item) => {
    setSelectedItem(item)
  }

  const handleCloseModal = () => {
    setSelectedItem(null)
  }

  return (
    <div className="items-container">
      <header className="items-header">
        <div className="header-content">
          <h1 className="title">Endfields Items</h1>
          <p className="subtitle">
            {filteredItems.length} of {data.totalItems} items
          </p>
        </div>

        <div className="controls">
          <div className="search-wrapper">
            <svg
              className="search-icon"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="view-toggle">
            <button
              className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </button>
            <button
              className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              aria-label="List view"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <rect x="3" y="4" width="18" height="4" rx="1" />
                <rect x="3" y="10" width="18" height="4" rx="1" />
                <rect x="3" y="16" width="18" height="4" rx="1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className={`items-${viewMode}`}>
        {filteredItems.map((item) => (
          <article
            key={item.id}
            className={`item-card ${viewMode}`}
            onClick={() => handleItemClick(item)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleItemClick(item)
              }
            }}
          >
            <div className="item-image-wrapper">
              <Image
                src={getImagePath(item.localImagePath)}
                alt={item.name}
                width={viewMode === 'grid' ? 80 : 48}
                height={viewMode === 'grid' ? 80 : 48}
                className="item-image"
              />
            </div>
            <div className="item-info">
              <h3 className="item-name">{item.name}</h3>
            </div>
          </article>
        ))}
      </main>

      {filteredItems.length === 0 && (
        <div className="no-results">
          <p>No items found matching &quot;{searchQuery}&quot;</p>
        </div>
      )}

      {selectedItem && relatedRecipes && (
        <div
          className="modal-backdrop"
          onClick={handleCloseModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={handleCloseModal} aria-label="Close modal">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            <div className="modal-header">
              <div className="modal-item-image">
                <Image
                  src={getImagePath(selectedItem.localImagePath)}
                  alt={selectedItem.name}
                  width={64}
                  height={64}
                  className="item-image"
                />
              </div>
              <h2 id="modal-title" className="modal-title">
                {selectedItem.name}
              </h2>
            </div>

            <div className="modal-body">
              {relatedRecipes.produces.length > 0 && (
                <section className="recipe-section">
                  <h3 className="recipe-section-title">Produced By</h3>
                  <div className="recipe-list">
                    {relatedRecipes.produces.map((recipe, index) => {
                      const facility = facilitiesByName.get(recipe.facility)
                      const outputItem = itemsByName.get(recipe.output)
                      return (
                        <div key={`produces-${index}`} className="recipe-card">
                          <div className="recipe-row recipe-row-inputs">
                            <span className="recipe-row-label">Inputs</span>
                            <div className="recipe-row-content">
                              {recipe.inputs.map((input, i) => {
                                const inputItem = itemsByName.get(input)
                                return (
                                  <div key={i} className="recipe-item-chip">
                                    {inputItem && (
                                      <Image
                                        src={getImagePath(inputItem.localImagePath)}
                                        alt={input}
                                        width={32}
                                        height={32}
                                        className="recipe-item-image"
                                      />
                                    )}
                                    <span className="recipe-item-name">{input}</span>
                                    {i < recipe.inputs.length - 1 && <span className="recipe-plus">+</span>}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                          <div className="recipe-arrow-down">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M20 12l-1.41-1.41L13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8 8-8z" />
                            </svg>
                          </div>
                          <div className="recipe-row recipe-row-facility">
                            <span className="recipe-row-label">Facility</span>
                            <div className="recipe-row-content">
                              <div className="recipe-facility-chip">
                                {facility && (
                                  <Image
                                    src={getImagePath(facility.localImagePath)}
                                    alt={recipe.facility}
                                    width={32}
                                    height={32}
                                    className="recipe-facility-image"
                                  />
                                )}
                                <span>{recipe.facility}</span>
                              </div>
                            </div>
                          </div>
                          <div className="recipe-arrow-down">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M20 12l-1.41-1.41L13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8 8-8z" />
                            </svg>
                          </div>
                          <div className="recipe-row recipe-row-output">
                            <span className="recipe-row-label">Output</span>
                            <div className="recipe-row-content">
                              <div className="recipe-output-chip">
                                {outputItem && (
                                  <Image
                                    src={getImagePath(outputItem.localImagePath)}
                                    alt={recipe.output}
                                    width={32}
                                    height={32}
                                    className="recipe-item-image"
                                  />
                                )}
                                <span className="recipe-item-name">{recipe.output}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>
              )}

              {relatedRecipes.usedIn.length > 0 && (
                <section className="recipe-section">
                  <h3 className="recipe-section-title">Used In</h3>
                  <div className="recipe-list">
                    {relatedRecipes.usedIn.map((recipe, index) => {
                      const facility = facilitiesByName.get(recipe.facility)
                      const outputItem = itemsByName.get(recipe.output)
                      return (
                        <div key={`usedIn-${index}`} className="recipe-card">
                          <div className="recipe-row recipe-row-inputs">
                            <span className="recipe-row-label">Inputs</span>
                            <div className="recipe-row-content">
                              {recipe.inputs.map((input, i) => {
                                const inputItem = itemsByName.get(input)
                                const isHighlighted = input === selectedItem.name
                                return (
                                  <div key={i} className={`recipe-item-chip ${isHighlighted ? 'highlighted' : ''}`}>
                                    {inputItem && (
                                      <Image
                                        src={getImagePath(inputItem.localImagePath)}
                                        alt={input}
                                        width={32}
                                        height={32}
                                        className="recipe-item-image"
                                      />
                                    )}
                                    <span className="recipe-item-name">{input}</span>
                                    {i < recipe.inputs.length - 1 && <span className="recipe-plus">+</span>}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                          <div className="recipe-arrow-down">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M20 12l-1.41-1.41L13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8 8-8z" />
                            </svg>
                          </div>
                          <div className="recipe-row recipe-row-facility">
                            <span className="recipe-row-label">Facility</span>
                            <div className="recipe-row-content">
                              <div className="recipe-facility-chip">
                                {facility && (
                                  <Image
                                    src={getImagePath(facility.localImagePath)}
                                    alt={recipe.facility}
                                    width={32}
                                    height={32}
                                    className="recipe-facility-image"
                                  />
                                )}
                                <span>{recipe.facility}</span>
                              </div>
                            </div>
                          </div>
                          <div className="recipe-arrow-down">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M20 12l-1.41-1.41L13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8 8-8z" />
                            </svg>
                          </div>
                          <div className="recipe-row recipe-row-output">
                            <span className="recipe-row-label">Output</span>
                            <div className="recipe-row-content">
                              <div className="recipe-output-chip">
                                {outputItem && (
                                  <Image
                                    src={getImagePath(outputItem.localImagePath)}
                                    alt={recipe.output}
                                    width={32}
                                    height={32}
                                    className="recipe-item-image"
                                  />
                                )}
                                <span className="recipe-item-name">{recipe.output}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>
              )}

              {relatedRecipes.produces.length === 0 && relatedRecipes.usedIn.length === 0 && (
                <div className="no-recipes">
                  <p>No recipes found for this item.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
