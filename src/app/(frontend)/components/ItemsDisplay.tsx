'use client'

import Link from 'next/link'
import { useState, useMemo } from 'react'
import type { RecipesData } from '../types/recipes'
import { ImageOrPlaceholder } from './ImageOrPlaceholder'

interface ItemsDisplayProps {
  data: RecipesData
}

type ViewMode = 'grid' | 'list'
const UNCATEGORIZED = 'Uncategorized'
const ALL_CATEGORIES = 'All'

export function ItemsDisplay({ data }: ItemsDisplayProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>(ALL_CATEGORIES)

  // Derive unique categories from items
  const categories = useMemo(() => {
    const categorySet = new Set<string>()
    for (const item of data.items) {
      if (item.category) {
        categorySet.add(item.category)
      }
    }
    return [ALL_CATEGORIES, ...Array.from(categorySet).sort(), UNCATEGORIZED]
  }, [data.items])

  const filteredItems = useMemo(() => {
    let items = data.items

    // Filter by category
    if (selectedCategory !== ALL_CATEGORIES) {
      if (selectedCategory === UNCATEGORIZED) {
        items = items.filter((item) => !item.category)
      } else {
        items = items.filter((item) => item.category === selectedCategory)
      }
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      items = items.filter((item) => item.name.toLowerCase().includes(query))
    }

    return items
  }, [data.items, searchQuery, selectedCategory])

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

          <select
            className="category-filter"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

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
          <Link
            key={item.id}
            href={`/items/${item.id}`}
            className={`item-card ${viewMode}`}
          >
            <div className="item-image-wrapper">
              <ImageOrPlaceholder
                imagePath={item.localImagePath}
                alt={item.name}
                width={viewMode === 'grid' ? 80 : 48}
                height={viewMode === 'grid' ? 80 : 48}
                className="item-image"
              />
            </div>
            <div className="item-info">
              <h3 className="item-name">{item.name}</h3>
            </div>
          </Link>
        ))}
      </main>

      {filteredItems.length === 0 && (
        <div className="no-results">
          <p>No items found matching &quot;{searchQuery}&quot;</p>
        </div>
      )}
    </div>
  )
}
