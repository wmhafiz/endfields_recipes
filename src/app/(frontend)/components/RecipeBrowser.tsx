'use client'

import Link from 'next/link'
import { useState, useMemo, useCallback } from 'react'
import type {
  EnrichedDbData,
  EnrichedRecipe,
  RecipeSortField,
  SortDirection,
  ViewMode,
} from '../types/recipes'
import { ImageOrPlaceholder } from './ImageOrPlaceholder'

interface RecipeBrowserProps {
  data: EnrichedDbData
}

const ALL = 'All'

// Helper to get unique values from an array
function getUniqueValues<T>(items: T[], getter: (item: T) => string | undefined): string[] {
  const values = new Set<string>()
  for (const item of items) {
    const value = getter(item)
    if (value) {
      values.add(value)
    }
  }
  return Array.from(values).sort()
}

// Format craft time for display (ms to seconds)
function formatCraftTime(ms: number): string {
  if (ms === 0) return 'Instant'
  const seconds = ms / 1000
  return seconds >= 60 ? `${Math.round(seconds / 60)}m` : `${seconds}s`
}

export function RecipeBrowser({ data }: RecipeBrowserProps) {
  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  // Search
  const [searchQuery, setSearchQuery] = useState('')

  // Filters
  const [selectedType, setSelectedType] = useState<string>(ALL)
  const [selectedCategory, setSelectedCategory] = useState<string>(ALL)
  const [selectedMachine, setSelectedMachine] = useState<string>(ALL)
  const [selectedRarity, setSelectedRarity] = useState<string>(ALL)
  const [usesRawMaterialFilter, setUsesRawMaterialFilter] = useState<string>(ALL)

  // Sorting
  const [sortField, setSortField] = useState<RecipeSortField>('default')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  // Build item lookup for image URLs and categories
  const itemsById = useMemo(() => {
    const map = new Map<string, { slug: string; imageUrl?: string; category?: string }>()
    for (const item of data.items) {
      map.set(item.itemId, { slug: item.slug, imageUrl: item.imageUrl, category: item.category })
    }
    return map
  }, [data.items])

  // Get category for a recipe (from primary output item)
  const getRecipeCategory = useCallback(
    (recipe: EnrichedRecipe): string | undefined => {
      const primaryOutput = recipe.outputs[0]
      if (!primaryOutput) return undefined
      return itemsById.get(primaryOutput.itemId)?.category
    },
    [itemsById],
  )

  // Derive filter options
  const typeOptions = useMemo(() => {
    return [ALL, ...getUniqueValues(data.recipes, (r) => r.type)]
  }, [data.recipes])

  // Category options derived from output items
  const categoryOptions = useMemo(() => {
    const categories = new Set<string>()
    for (const recipe of data.recipes) {
      const category = getRecipeCategory(recipe)
      if (category) {
        categories.add(category)
      }
    }
    return [ALL, ...Array.from(categories).sort()]
  }, [data.recipes, getRecipeCategory])

  const machineOptions = useMemo(() => {
    return [ALL, ...getUniqueValues(data.recipes, (r) => r.machineName)]
  }, [data.recipes])

  const rarityOptions = useMemo(() => {
    const rarities = getUniqueValues(data.recipes, (r) => r.rarity)
    // Sort numerically
    return [ALL, ...rarities.sort((a, b) => Number(a) - Number(b))]
  }, [data.recipes])

  // Filter and search recipes
  const filteredRecipes = useMemo(() => {
    let recipes = data.recipes

    // Filter by type
    if (selectedType !== ALL) {
      recipes = recipes.filter((r) => r.type === selectedType)
    }

    // Filter by category (from output item)
    if (selectedCategory !== ALL) {
      recipes = recipes.filter((r) => getRecipeCategory(r) === selectedCategory)
    }

    // Filter by machine
    if (selectedMachine !== ALL) {
      recipes = recipes.filter((r) => r.machineName === selectedMachine)
    }

    // Filter by rarity
    if (selectedRarity !== ALL) {
      recipes = recipes.filter((r) => r.rarity === selectedRarity)
    }

    // Filter by uses raw material
    if (usesRawMaterialFilter !== ALL) {
      const usesRaw = usesRawMaterialFilter === 'yes'
      recipes = recipes.filter((r) => r.usesRawMaterial === usesRaw)
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      recipes = recipes.filter((recipe) => {
        // Match output name
        const outputMatch = recipe.outputs.some((o) => o.itemName.toLowerCase().includes(query))
        if (outputMatch) return true

        // Match description
        if (recipe.description?.toLowerCase().includes(query)) return true

        // Match ingredient names
        const ingredientMatch = recipe.ingredients.some((i) =>
          i.itemName.toLowerCase().includes(query),
        )
        if (ingredientMatch) return true

        // Match machine name
        if (recipe.machineName.toLowerCase().includes(query)) return true

        // Match recipe name
        if (recipe.name.toLowerCase().includes(query)) return true

        return false
      })
    }

    return recipes
  }, [
    data.recipes,
    selectedType,
    selectedCategory,
    selectedMachine,
    selectedRarity,
    usesRawMaterialFilter,
    searchQuery,
    getRecipeCategory,
  ])

  // Sort recipes
  const sortedRecipes = useMemo(() => {
    const sorted = [...filteredRecipes]

    const sortFn = (a: EnrichedRecipe, b: EnrichedRecipe): number => {
      let comparison = 0

      switch (sortField) {
        case 'default':
          comparison = Number(a.sortId) - Number(b.sortId)
          break
        case 'name':
          comparison = (a.outputs[0]?.itemName || a.name).localeCompare(
            b.outputs[0]?.itemName || b.name,
          )
          break
        case 'craftTime':
          // Use machineCraftTime (from machine)
          comparison = a.machineCraftTime - b.machineCraftTime
          break
        case 'type':
          comparison = a.type.localeCompare(b.type)
          break
        case 'category': {
          // Sort by output item category
          const catA = getRecipeCategory(a) || ''
          const catB = getRecipeCategory(b) || ''
          comparison = catA.localeCompare(catB)
          break
        }
      }

      return sortDirection === 'desc' ? -comparison : comparison
    }

    sorted.sort(sortFn)
    return sorted
  }, [filteredRecipes, sortField, sortDirection, getRecipeCategory])

  // Get image URL for an item
  const getItemImage = useCallback(
    (itemId: string): string | undefined => {
      return itemsById.get(itemId)?.imageUrl
    },
    [itemsById],
  )

  // Get slug for an item
  const getItemSlug = useCallback(
    (itemId: string): string => {
      return itemsById.get(itemId)?.slug || itemId
    },
    [itemsById],
  )

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('')
    setSelectedType(ALL)
    setSelectedCategory(ALL)
    setSelectedMachine(ALL)
    setSelectedRarity(ALL)
    setUsesRawMaterialFilter(ALL)
    setSortField('default')
    setSortDirection('asc')
  }

  const hasActiveFilters =
    searchQuery ||
    selectedType !== ALL ||
    selectedCategory !== ALL ||
    selectedMachine !== ALL ||
    selectedRarity !== ALL ||
    usesRawMaterialFilter !== ALL

  return (
    <div className="items-container">
      <header className="items-header">
        <div className="header-content">
          <h1 className="title">Recipe Browser</h1>
          <p className="subtitle">
            {sortedRecipes.length} of {data.recipes.length} recipes
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
              placeholder="Search recipes..."
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

      {/* Filter Controls */}
      <div className="recipe-filters">
        <div className="filter-row">
          <select
            className="category-filter"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            aria-label="Filter by type"
          >
            {typeOptions.map((type) => (
              <option key={type} value={type}>
                {type === ALL ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>

          <select
            className="category-filter"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            aria-label="Filter by category"
          >
            {categoryOptions.map((cat) => (
              <option key={cat} value={cat}>
                {cat === ALL ? 'All Categories' : cat}
              </option>
            ))}
          </select>

          <select
            className="category-filter"
            value={selectedMachine}
            onChange={(e) => setSelectedMachine(e.target.value)}
            aria-label="Filter by machine"
          >
            {machineOptions.map((machine) => (
              <option key={machine} value={machine}>
                {machine === ALL ? 'All Machines' : machine}
              </option>
            ))}
          </select>

          <select
            className="category-filter"
            value={selectedRarity}
            onChange={(e) => setSelectedRarity(e.target.value)}
            aria-label="Filter by rarity"
          >
            {rarityOptions.map((rarity) => (
              <option key={rarity} value={rarity}>
                {rarity === ALL ? 'All Rarities' : `Rarity ${rarity}`}
              </option>
            ))}
          </select>

          <select
            className="category-filter"
            value={usesRawMaterialFilter}
            onChange={(e) => setUsesRawMaterialFilter(e.target.value)}
            aria-label="Filter by raw material usage"
          >
            <option value={ALL}>Raw Materials: Any</option>
            <option value="yes">Uses Raw Materials</option>
            <option value="no">No Raw Materials</option>
          </select>
        </div>

        <div className="filter-row">
          <div className="sort-controls">
            <select
              className="category-filter"
              value={sortField}
              onChange={(e) => setSortField(e.target.value as RecipeSortField)}
              aria-label="Sort by"
            >
              <option value="default">Sort: Default</option>
              <option value="name">Sort: Name</option>
              <option value="craftTime">Sort: Craft Time</option>
              <option value="type">Sort: Type</option>
              <option value="category">Sort: Category</option>
            </select>

            <button
              className="sort-direction-btn"
              onClick={() => setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))}
              aria-label={`Sort ${sortDirection === 'asc' ? 'ascending' : 'descending'}`}
            >
              {sortDirection === 'asc' ? '↑' : '↓'}
            </button>
          </div>

          {hasActiveFilters && (
            <button className="clear-filters-btn" onClick={clearFilters}>
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Recipe Cards */}
      <main className={`items-${viewMode}`}>
        {sortedRecipes.map((recipe) => {
          const primaryOutput = recipe.outputs[0]
          const outputSlug = primaryOutput ? getItemSlug(primaryOutput.itemId) : recipe.id
          const outputImage = primaryOutput ? getItemImage(primaryOutput.itemId) : undefined
          const category = getRecipeCategory(recipe)

          return (
            <Link key={recipe.id} href={`/items/${outputSlug}`} className={`item-card ${viewMode}`}>
              <div className="item-image-wrapper">
                <ImageOrPlaceholder
                  imagePath={outputImage}
                  alt={primaryOutput?.itemName || recipe.name}
                  width={viewMode === 'grid' ? 80 : 48}
                  height={viewMode === 'grid' ? 80 : 48}
                  className="item-image"
                />
              </div>
              <div className="item-info">
                <h3 className="item-name">{primaryOutput?.itemName || recipe.name}</h3>
                {viewMode === 'grid' && (
                  <span className="recipe-machine-name">{recipe.machineName}</span>
                )}
                {viewMode === 'list' && (
                  <div className="recipe-meta">
                    <span className="recipe-meta-item">{recipe.machineName}</span>
                    {category && (
                      <>
                        <span className="recipe-meta-separator">•</span>
                        <span className="recipe-meta-item">{category}</span>
                      </>
                    )}
                    {recipe.machineCraftTime > 0 && (
                      <>
                        <span className="recipe-meta-separator">•</span>
                        <span className="recipe-meta-item">
                          {formatCraftTime(recipe.machineCraftTime)}
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </Link>
          )
        })}
      </main>

      {/* No Results */}
      {sortedRecipes.length === 0 && (
        <div className="no-results">
          <p>No recipes found matching your criteria</p>
          {hasActiveFilters && (
            <button className="clear-filters-btn" onClick={clearFilters}>
              Clear Filters
            </button>
          )}
        </div>
      )}
    </div>
  )
}
